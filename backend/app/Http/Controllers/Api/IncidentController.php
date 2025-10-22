<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\User;
use App\Models\IncidentNote;
use App\Models\Attachment;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Category;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Jobs\SendIncidentNotification;
use App\Jobs\ProcessCsvImport;

class IncidentController extends Controller
{
    /**
     * Display a listing of all incidents (operators/admins only)
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);
        
        $incidents = Incident::with(['category', 'citizen', 'assignedAgent', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'incidents' => $incidents->items(),
            'pagination' => [
                'current_page' => $incidents->currentPage(),
                'last_page' => $incidents->lastPage(),
                'per_page' => $incidents->perPage(),
                'total' => $incidents->total(),
                'has_more_pages' => $incidents->hasMorePages(),
            ]
        ], 200);
    }

    /**
     * Display incidents for the authenticated citizen.
     */
    public function myIncidents(Request $request)
    {
        $user = $request->user();
        
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);
        
        $incidents = $user->reportedIncidents()
            ->with(['category', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'incidents' => $incidents->items(),
            'pagination' => [
                'current_page' => $incidents->currentPage(),
                'last_page' => $incidents->lastPage(),
                'per_page' => $incidents->perPage(),
                'total' => $incidents->total(),
                'has_more_pages' => $incidents->hasMorePages(),
            ]
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'location_lat' => 'nullable|numeric|between:-90,90',
            'location_lng' => 'nullable|numeric|between:-180,180',
            'attachments.*' => 'nullable|file|mimes:jpeg,png,jpg,gif,pdf,doc,docx,txt|max:10240', // 10MB max
        ]);

        $user = $request->user();

        $incident = Incident::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category_id' => $validated['category_id'],
            'location_lat' => $validated['location_lat'],
            'location_lng' => $validated['location_lng'],
            'citizen_id' => $user->id,
            'priority' => 'Low', // Default priority - agents will update this
            'status' => 'New',
        ]);

        // Handle file uploads
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $filename = time() . '_' . $file->getClientOriginalName();
                $storageKey = $file->storeAs('incident_attachments', $filename, 'public');
                
                // Create attachment record
                $incident->attachments()->create([
                    'filename' => $file->getClientOriginalName(),
                    'content_type' => $file->getMimeType(),
                    'size_bytes' => $file->getSize(),
                    'storage_key' => $storageKey,
                ]);
            }
        }

        // Dispatch background job to send notifications
        SendIncidentNotification::dispatch(
            $incident,
            'created',
            $user->email ?? 'citizen@example.com', // Fallback email
            $user->name ?? 'Citizen'
        );

        return response()->json([
            'message' => 'Incident created successfully',
            'incident' => $incident->load(['category', 'attachments']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Incident $incident)
    {
        $user = $request->user();
        $userRole = $user->role;
        
        // Check permissions based on user role
        if ($userRole === 'citizen') {
            // Citizens can only view their own incidents
            if ($incident->citizen_id !== $user->id) {
                return response()->json([
                    'message' => 'You can only view your own incidents'
                ], 403);
            }
        } elseif ($userRole === 'agent') {
            // Agents can view incidents assigned to them or their own incidents
            if ($incident->assigned_agent_id !== $user->id && $incident->citizen_id !== $user->id) {
                return response()->json([
                    'message' => 'You can only view incidents assigned to you or your own incidents'
                ], 403);
            }
        }
        // Operators and admins can view any incident (no additional checks)
        
        return response()->json([
            'incident' => $incident->load(['category', 'citizen', 'assignedAgent', 'attachments', 'notes'])
        ], 200);
    }

    public function update(Request $request, Incident $incident)
    {
        $user = $request->user();
        
        // Check if user owns this incident
        if ($incident->citizen_id !== $user->id) {
            return response()->json([
                'message' => 'You can only update your own incidents'
            ], 403);
        }
        
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'location_lat' => 'sometimes|numeric|between:-90,90',
            'location_lng' => 'sometimes|numeric|between:-180,180',
        ]);
        
        $incident->update($validated);
        
        return response()->json([
            'message' => 'Incident updated successfully',
            'incident' => $incident->load('category')
        ], 200);
    }

    public function deleteAll(Request $request)
    {
        $user = $request->user();
        
        try {
            DB::transaction(function () use ($user) {
                $incidents = $user->reportedIncidents()->with('attachments')->get();
                
                foreach ($incidents as $incident) {
                    foreach ($incident->attachments as $attachment) {
                        Storage::disk('public')->delete($attachment->storage_key);
                        $attachment->delete();
                    }
                    
                    \App\Models\AuditLog::create([
                        'incident_id' => $incident->id,
                        'actor_id' => $user->id,
                        'action' => 'deleted',
                        'entity_type' => 'incident',
                        'entity_id' => $incident->id,
                        'old_values' => json_encode([
                            'title' => $incident->title,
                            'description' => $incident->description,
                            'status' => $incident->status,
                            'priority' => $incident->priority
                        ]),
                        'new_values' => null
                    ]);
                    
                    $incident->delete();
                }
            });
            
            return response()->json([
                'message' => 'All incidents deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete incidents: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, Incident $incident)
    {
        $user = $request->user();
        
        if ($incident->citizen_id !== $user->id) {
            return response()->json([
                'message' => 'You can only delete your own incidents'
            ], 403);
        }
        
        try {
            DB::transaction(function () use ($incident) {

                foreach ($incident->attachments as $attachment) {

                    Storage::disk('public')->delete($attachment->storage_key);
                

                    $attachment->delete();
                }
                
                \App\Models\AuditLog::create([
                    'incident_id' => $incident->id,
                    'actor_id' => $user->id,
                    'action' => 'deleted',
                    'entity_type' => 'incident',
                    'entity_id' => $incident->id,
                    'old_values' => json_encode([
                        'title' => $incident->title,
                        'description' => $incident->description,
                        'status' => $incident->status,
                        'priority' => $incident->priority
                    ]),
                    'new_values' => null
                ]);
                
                $incident->delete();
            });
            
            return response()->json([
                'message' => 'Incident deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete incident: ' . $e->getMessage()
            ], 500);
        }
    }

    public function assign(Request $request, Incident $incident)
    {
        $user = $request->user();
        $validated = $request->validate([
            'agent_id' => 'nullable|exists:users,id',
        ]);

        if ($validated['agent_id']) {
            $agent = User::find($validated['agent_id']);
            if ($agent->role !== 'agent') {
                return response()->json([
                    'message' => 'User must be an agent to be assigned incidents'
                ], 400);
            }


            $oldAgentId = $incident->assigned_agent_id;
            $oldStatus = $incident->status;

            $incident->update([
                'assigned_agent_id' => $validated['agent_id'],
                'status' => 'Assigned'
            ]);


            AuditLog::create([
                'incident_id' => $incident->id,
                'actor_id' => $user->id,
                'action' => 'assigned',
                'old_values' => json_encode([
                    'assigned_agent_id' => $oldAgentId,
                    'status' => $oldStatus
                ]),
                'new_values' => json_encode([
                    'assigned_agent_id' => $validated['agent_id'],
                    'status' => 'Assigned'
                ])
            ]);

            $message = 'Incident assigned successfully';
        } else {

            $oldAgentId = $incident->assigned_agent_id;
            $oldStatus = $incident->status;


            $incident->update([
                'assigned_agent_id' => null,
                'status' => 'New'
            ]);


            AuditLog::create([
                'incident_id' => $incident->id,
                'actor_id' => $user->id,
                'action' => 'unassigned',
                'old_values' => json_encode([
                    'assigned_agent_id' => $oldAgentId,
                    'status' => $oldStatus
                ]),
                'new_values' => json_encode([
                    'assigned_agent_id' => null,
                    'status' => 'New'
                ])
            ]);

            $message = 'Incident unassigned successfully';
        }

        // Dispatch background job to send assignment notification
        if ($incident->assigned_agent_id) {
            $agent = User::find($incident->assigned_agent_id);
            SendIncidentNotification::dispatch(
                $incident,
                'assigned',
                $agent->email ?? 'agent@example.com',
                $agent->name ?? 'Agent'
            );
        }

        return response()->json([
            'message' => $message,
            'incident' => $incident->load(['category', 'citizen', 'assignedAgent'])
        ], 200);
    }

    public function updatePriority(Request $request, Incident $incident)
    {
        $user = $request->user();
        $validated = $request->validate([
            'priority' => 'required|in:Low,Medium,High'
        ]);


        $oldPriority = $incident->priority;

        $incident->update(['priority' => $validated['priority']]);


        AuditLog::create([
            'incident_id' => $incident->id,
            'actor_id' => $user->id,
            'action' => 'priority_changed',
            'old_values' => json_encode(['priority' => $oldPriority]),
            'new_values' => json_encode(['priority' => $validated['priority']])
        ]);

        return response()->json([
            'message' => 'Incident priority updated successfully',
            'incident' => $incident->load(['category', 'citizen', 'assignedAgent'])
        ], 200);
    }

    
    public function assignedIncidents(Request $request)
    {
        $user = $request->user();
        
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $incidents = Incident::with(['category', 'citizen', 'attachments'])
            ->where('assigned_agent_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'incidents' => $incidents->items(),
            'pagination' => [
                'current_page' => $incidents->currentPage(),
                'last_page' => $incidents->lastPage(),
                'per_page' => $incidents->perPage(),
                'total' => $incidents->total(),
                'has_more_pages' => $incidents->hasMorePages(),
            ]
        ], 200);
    }

    
    public function updateStatus(Request $request, Incident $incident)
    {
        $user = $request->user();

        if ($incident->assigned_agent_id !== $user->id) {
            return response()->json([
                'message' => 'Only the assigned agent can update status'
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string'
        ]);


        $allowedStatuses = ['In Progress', 'Resolved', 'Unresolved'];
        if (!in_array($validated['status'], $allowedStatuses)) {
            return response()->json([
                'message' => 'The selected status is invalid.',
                'errors' => [
                    'status' => ['The selected status is invalid.']
                ]
            ], 422);
        }


        $oldStatus = $incident->status;
        
        $incident->update([
            'status' => $validated['status'],
            'resolved_at' => in_array($validated['status'], ['Resolved']) ? now() : null,
        ]);


        AuditLog::create([
            'incident_id' => $incident->id,
            'actor_id' => $user->id,
            'action' => 'status_changed',
            'old_values' => json_encode(['status' => $oldStatus]),
            'new_values' => json_encode(['status' => $validated['status']])
        ]);

        // Dispatch background job to send status change notification
        $citizen = User::find($incident->citizen_id);
        SendIncidentNotification::dispatch(
            $incident,
            'status_changed',
            $citizen->email ?? 'citizen@example.com',
            $citizen->name ?? 'Citizen'
        );

        return response()->json([
            'message' => 'Incident status updated successfully',
            'incident' => $incident->load(['category', 'citizen', 'assignedAgent'])
        ], 200);
    }


    public function addNote(Request $request, Incident $incident)
    {
        $user = $request->user();

        if ($incident->assigned_agent_id !== $user->id) {
            return response()->json([
                'message' => 'Only the assigned agent can add notes'
            ], 403);
        }

        $validated = $request->validate([
            'body' => 'required|string'
        ]);

        $note = IncidentNote::create([
            'incident_id' => $incident->id,
            'user_id' => $user->id,
            'body' => $validated['body'],
        ]);


        AuditLog::create([
            'incident_id' => $incident->id,
            'actor_id' => $user->id,
            'action' => 'note_added',
            'old_values' => null,
            'new_values' => json_encode(['note' => $validated['body']])
        ]);

        return response()->json([
            'message' => 'Note added',
            'note' => $note
        ], 201);
    }

    public function uploadAttachment(Request $request, Incident $incident)
    {
        $user = $request->user();
        

        if ($incident->citizen_id !== $user->id && $incident->assigned_agent_id !== $user->id) {
            return response()->json([
                'message' => 'You can only upload attachments to your own incidents or assigned incidents'
            ], 403);
        }

        $validated = $request->validate([
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,pdf,doc,docx,txt'
        ]);

        $file = $validated['file'];
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('incident_attachments', $filename, 'public');

        $attachment = Attachment::create([
            'incident_id' => $incident->id,
            'filename' => $file->getClientOriginalName(),
            'content_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'storage_key' => $path,
        ]);


        AuditLog::create([
            'incident_id' => $incident->id,
            'actor_id' => $user->id,
            'action' => 'attachment_added',
            'old_values' => null,
            'new_values' => json_encode(['attachment' => $file->getClientOriginalName()])
        ]);

        return response()->json([
            'message' => 'File uploaded successfully',
            'attachment' => $attachment
        ], 201);
    }

    
    public function getAttachments(Incident $incident)
    {
        $attachments = $incident->attachments()->get();

        return response()->json([
            'attachments' => $attachments
        ], 200);
    }
    public function DeleteAttachment(Request $request, Attachment $attachment)
    {
        $user = $request->user();
        if ($attachment->incident->citizen_id !== $user->id && $attachment->incident->assigned_agent_id !== $user->id) {
            return response()->json([
                'message' => 'You can only delete your own attachments'
            ], 403);
        }

        $attachmentName = $attachment->filename;
        $incidentId = $attachment->incident_id;

        Storage::disk('public')->delete($attachment->storage_key);

        $attachment->delete();


        AuditLog::create([
            'incident_id' => $incidentId,
            'actor_id' => $user->id,
            'action' => 'deleted',
            'entity_type' => 'attachment',
            'entity_id' => $attachment->id,
            'old_values' => json_encode(['filename' => $attachmentName]),
            'new_values' => null
        ]);

        return response()->json([
            'message' => 'Attachment deleted successfully'
        ], 200);

    }
 
    public function getCategories()
    {
    return Category::query()
        ->where('is_active', true)
        ->orderBy('name')
        ->get(['id','name']);
    }

    
    public function downloadAttachment(Request $request, Attachment $attachment)
    {
        $user = $request->user();
        
        if ($attachment->incident->citizen_id !== $user->id && $attachment->incident->assigned_agent_id !== $user->id) {
            return response()->json([
                'message' => 'You can only download attachments from your own incidents or assigned incidents'
            ], 403);
        }

        if (!Storage::disk('public')->exists($attachment->storage_key)) {
            return response()->json([
                'message' => 'File not found'
            ], 404);
        }

        return Storage::disk('public')->download($attachment->storage_key, $attachment->filename);
    }

    /**
     * Import incidents from CSV file (operators/admins only)
     */
    public function importCsv(Request $request)
    {
        // Validate the uploaded file
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:102400' // 100MB for large files
        ]);

        $file = $request->file('csv_file');
        $filePath = $file->store('temp/csv-imports');
        $operatorId = $request->user()->id;
        $importId = uniqid('import_');

        // Dispatch background job to process CSV
        ProcessCsvImport::dispatch($filePath, $operatorId, $importId);

        return response()->json([
            'message' => 'CSV import started. You will be notified when processing is complete.',
            'import_id' => $importId,
            'status' => 'processing'
        ], 202); // 202 Accepted - indicates request is being processed asynchronously
    }

    /**
     * Get CSV import progress
     */
    public function getImportProgress($importId)
    {
        $progress = cache()->get("csv_import_progress_{$importId}");
        $results = cache()->get("csv_import_results_{$importId}");
        
        if ($results) {
            // Import completed
            return response()->json([
                'import_id' => $importId,
                'status' => 'completed',
                'results' => $results
            ]);
        } elseif ($progress) {
            // Import in progress
            return response()->json($progress);
        } else {
            // Import not found or expired
            return response()->json([
                'import_id' => $importId,
                'status' => 'not_found',
                'message' => 'Import not found or has expired'
            ], 404);
        }
    }

    /**
     * parse CSV file and return array of rows
     */
    private function parseCsvFile($file)
    {
        $csvData = [];
        $handle = fopen($file->getPathname(), 'r');
        
        // Skip header row
        $header = fgetcsv($handle);
        
        while (($row = fgetcsv($handle)) !== false) {
            $csvData[] = [
                'title' => $row[0] ?? '',
                'description' => $row[1] ?? '',
                'category_id' => $row[2] ?? '',
                'latitude' => $row[3] ?? '',
                'longitude' => $row[4] ?? '',
                'citizen_username' => $row[5] ?? '',
                'priority' => $row[6] ?? 'medium',
                'status' => $row[7] ?? 'new'
            ];
        }
        
        fclose($handle);
        return $csvData;
    }

    /**
     * validate a single CSV row
     */
    private function validateCsvRow($row, $rowNumber)
    {
        //check required fields
        if (empty($row['title'])) {
            return ['valid' => false, 'error' => 'Title is required'];
        }
        
        if (empty($row['description'])) {
            return ['valid' => false, 'error' => 'Description is required'];
        }
        
        if (empty($row['category_id']) || !is_numeric($row['category_id'])) {
            return ['valid' => false, 'error' => 'Valid category_id is required'];
        }
        
        if (empty($row['latitude']) || !is_numeric($row['latitude'])) {
            return ['valid' => false, 'error' => 'Valid latitude is required'];
        }
        
        if (empty($row['longitude']) || !is_numeric($row['longitude'])) {
            return ['valid' => false, 'error' => 'Valid longitude is required'];
        }
        
        if (empty($row['citizen_username'])) {
            return ['valid' => false, 'error' => 'Citizen username is required'];
        }
        
        //validate category exists
        $category = Category::find($row['category_id']);
        if (!$category) {
            return ['valid' => false, 'error' => "Category ID {$row['category_id']} does not exist"];
        }
        
        //validate priority
        $validPriorities = ['low', 'medium', 'high'];
        if (!in_array($row['priority'], $validPriorities)) {
            return ['valid' => false, 'error' => "Invalid priority. Must be: " . implode(', ', $validPriorities)];
        }
        
        //validate status
        $validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
        if (!in_array($row['status'], $validStatuses)) {
            return ['valid' => false, 'error' => "Invalid status. Must be: " . implode(', ', $validStatuses)];
        }
        
        return ['valid' => true];
    }

    /**
     * find existing citizen or create new one
     */
    private function findOrCreateCitizen($username)
    {
        //first try to find by username (name field)
        $citizen = User::where('name', $username)->where('role', 'citizen')->first();
        
        if ($citizen) {
            return $citizen;
        }
        
        //create new citizen account
        $citizen = User::create([
            'name' => $username,
            'email' => null, // No email for CSV-imported users
            'password' => null, // No password for CSV-imported users
            'role' => 'citizen',
            'status' => 'active'
        ]);
        
        return $citizen;
    }

    /**
     * create incident from CSV row data
     */
    private function createIncidentFromRow($row, $citizen)
    {
        $incident = Incident::create([
            'title' => $row['title'],
            'description' => $row['description'],
            'category_id' => $row['category_id'],
            'location_lat' => $row['latitude'],
            'location_lng' => $row['longitude'],
            'citizen_id' => $citizen->id,
            'priority' => $row['priority'],
            'status' => $row['status']
        ]);
        
        return $incident;
    }
}