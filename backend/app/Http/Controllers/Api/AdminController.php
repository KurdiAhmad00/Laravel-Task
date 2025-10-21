<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Category;
use App\Models\AuditLog;
use App\Models\Incident;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * List all users (admin only)
     */
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'role', 'status', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'users' => $users
        ], 200);
    }

    /**
     * Get all agents (operators and admins can access)
     */
    public function getAgents()
    {
        $agents = User::select('id', 'name', 'email', 'role')
            ->where('role', 'agent')
            ->orderBy('name')
            ->get();

        return response()->json([
            'agents' => $agents
        ], 200);
    }

    /**
     * Update user role (admin only)
     */
    public function updateRole(Request $request, User $user)
    {
        $currentUser = $request->user();
        
        // Prevent admin from changing their own role
        if ($currentUser->id === $user->id) {
            return response()->json([
                'message' => 'You cannot change your own role',
                'errors' => ['role' => ['You cannot change your own role']]
            ], 403);
        }
        
        // Prevent admin from assigning admin role to others
        $validated = $request->validate([
            'role' => 'required|in:citizen,operator,agent,admin'
        ]);
        
        if ($validated['role'] === 'admin') {
            return response()->json([
                'message' => 'You cannot assign admin role to other users',
                'errors' => ['role' => ['You cannot assign admin role to other users']]
            ], 403);
        }

        $user->update(['role' => $validated['role']]);

        return response()->json([
            'message' => 'User role updated successfully',
            'user' => $user
        ], 200);
    }
    public function getCategories()
    {
        $categories = Category::orderBy('name')->get();

        return response()->json([
            'categories' => $categories
        ], 200);
    }

    public function createCategory(Request $request)
    {
        $currentUser = $request->user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $category = Category::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->createAuditLog(
            $currentUser->id,
            'created',
            'category',
            $category->id,
            null,
            [
                'name' => $category->name,
                'description' => $category->description,
                'is_active' => $category->is_active
            ]
        );

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category
        ], 201);
    }

    /**
     * Update a category (admin only)
     */
    public function updateCategory(Request $request, Category $category)
    {
        $currentUser = $request->user();
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $oldValues = [
            'name' => $category->name,
            'description' => $category->description,
            'is_active' => $category->is_active
        ];

        $category->update($validated);

        $this->createAuditLog(
            $currentUser->id,
            'updated',
            'category',
            $category->id,
            $oldValues,
            [
                'name' => $category->name,
                'description' => $category->description,
                'is_active' => $category->is_active
            ]
        );

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => $category
        ], 200);
    }


    public function deleteCategory(Request $request, Category $category)
    {
        $currentUser = $request->user();
        
        if ($category->incidents()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with existing incidents'
            ], 400);
        }

        $categoryData = [
            'name' => $category->name,
            'description' => $category->description,
            'is_active' => $category->is_active
        ];

        $category->delete();

        $this->createAuditLog(
            $currentUser->id,
            'deleted',
            'category',
            $category->id,
            $categoryData,
            null
        );

        return response()->json([
            'message' => 'Category deleted successfully'
        ], 200);
    }
    public function getAuditLogs(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $page = $request->get('page', 1);
        
        $query = AuditLog::with(['incident', 'actor'])
            ->orderBy('created_at', 'desc');
        
        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }
        
        if ($request->has('entity_type') && $request->entity_type) {
            $query->where('entity_type', $request->entity_type);
        }
        
        if ($request->has('actor') && $request->actor) {
            $query->whereHas('actor', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->actor . '%')
                  ->orWhere('email', 'like', '%' . $request->actor . '%');
            });
        }
        
        $auditLogs = $query->paginate($perPage, ['*'], 'page', $page);
            
        return response()->json([
            'audit_logs' => $auditLogs->items(),
            'totalPages' => $auditLogs->lastPage(),
            'currentPage' => $auditLogs->currentPage(),
            'total' => $auditLogs->total(),
        ], 200);
    }
    
    public function getIncidentAuditLogs(Incident $incident)
    {
        $auditLogs = AuditLog::with(['actor'])
            ->where('incident_id', $incident->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'incident' => $incident->load(['category', 'citizen', 'assignedAgent']),
            'audit_logs' => $auditLogs
        ], 200);
    }
    public function deleteUser(Request $request, User $user)
    {
        $currentUser = $request->user();
        

        if ($currentUser->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account',
                'errors' => ['user' => ['You cannot delete your own account']]
            ], 403);
        }
        

        $constraints = $this->getUserConstraints($user);
        
        if ($this->hasConstraints($constraints)) {
            return response()->json([
                'message' => 'User has associated data that prevents deletion',
                'constraints' => $constraints,
                'errors' => ['user' => ['User has associated data and cannot be deleted']]
            ], 400);
        }
        

        $this->createAuditLog(
            $currentUser->id,
            'deleted',
            'user',
            $user->id,
            [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status
            ],
            null
        );
        
        $user->delete();
        
        return response()->json([
            'message' => 'User deleted successfully'
        ], 200);
    }

    public function deleteUserWithCascade(Request $request, User $user)
    {
        $currentUser = $request->user();
        

        if ($currentUser->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account',
                'errors' => ['user' => ['You cannot delete your own account']]
            ], 403);
        }
        
        try {
            \DB::beginTransaction();
            
            $userIncidents = $user->incidents()->get();
            
            foreach ($userIncidents as $incident) {
                $incident->attachments()->delete();
                $incident->auditLogs()->delete();
                $incident->notes()->delete();
            }
            
            $user->incidents()->delete();
            
            Incident::where('assigned_agent_id', $user->id)->update(['assigned_agent_id' => null]);
            

            $this->createAuditLog(
                $currentUser->id,
                'cascade_deleted',
                'user',
                $user->id,
                [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'deleted_incidents' => $userIncidents->count(),
                    'deleted_attachments' => $userIncidents->sum(function($incident) {
                        return $incident->attachments()->count();
                    }),
                    'deleted_audit_logs' => $userIncidents->sum(function($incident) {
                        return $incident->auditLogs()->count();
                    }),
                    'deleted_notes' => $userIncidents->sum(function($incident) {
                        return $incident->notes()->count();
                    })
                ],
                null
            );
            

            $user->auditLogs()->delete();
            

            $user->delete();
            
            \DB::commit();
            
            return response()->json([
                'message' => 'User and all associated data deleted successfully'
            ], 200);
            
        } catch (\Exception $e) {
            \DB::rollback();
            
            return response()->json([
                'message' => 'Failed to delete user and associated data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function getUserConstraints(User $user)
    {
        $incidents = $user->incidents()->get();
        $totalAttachments = $incidents->sum(function($incident) {
            return $incident->attachments()->count();
        });
        $totalIncidentAuditLogs = $incidents->sum(function($incident) {
            return $incident->auditLogs()->count();
        });
        $totalIncidentNotes = $incidents->sum(function($incident) {
            return $incident->notes()->count();
        });
        
        return [
            'incidents' => $incidents->count(),
            'assignedIncidents' => Incident::where('assigned_agent_id', $user->id)->count(),
            'auditLogs' => $user->auditLogs()->count(),
            'attachments' => $totalAttachments,
            'incidentAuditLogs' => $totalIncidentAuditLogs,
            'incidentNotes' => $totalIncidentNotes
        ];
    }

    private function hasConstraints($constraints)
    {
        return $constraints['incidents'] > 0 || 
               $constraints['assignedIncidents'] > 0 || 
               $constraints['auditLogs'] > 0 ||
               $constraints['attachments'] > 0 ||
               $constraints['incidentAuditLogs'] > 0 ||
               $constraints['incidentNotes'] > 0;
    }

    private function createAuditLog($actorId, $action, $entityType, $entityId, $oldValues = null, $newValues = null, $incidentId = null)
    {
        \App\Models\AuditLog::create([
            'incident_id' => $incidentId,
            'actor_id' => $actorId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues ? json_encode($oldValues) : null,
            'new_values' => $newValues ? json_encode($newValues) : null,
        ]);
    }}
