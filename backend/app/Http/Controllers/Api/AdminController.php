<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Category;
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
        $validated = $request->validate([
            'role' => 'required|in:citizen,operator,agent,admin'
        ]);

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
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => $category
        ], 200);
    }

    /**
     * Delete a category (admin only)
     */
    public function deleteCategory(Category $category)
    {
        if ($category->incidents()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with existing incidents'
            ], 400);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully'
        ], 200);
    }
    public function getAuditLogs(Request $request)
    {
        return response()->json(['message' => 'Audit logs endpoint - coming soon'], 200);

    }
    public function getIncidentAuditLogs(Incident $incident)
    {
        return response()->json(['message' => 'Incident audit logs endpoint - coming soon'], 200);

    }
}
