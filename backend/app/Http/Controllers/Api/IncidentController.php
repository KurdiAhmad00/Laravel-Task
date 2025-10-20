<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\User;
use App\Models\IncidentNote;
use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Category;

class IncidentController extends Controller
{
    /**
     * Display a listing of all incidents (operators/admins only)
     */
    public function index(Request $request)
    {
        $incidents = Incident::with(['category', 'citizen', 'assignedAgent'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'incidents' => $incidents
        ], 200);
    }

    /**
     * Display incidents for the authenticated citizen.
     */
    public function myIncidents(Request $request)
    {
        $user = $request->user();
        
        $incidents = $user->reportedIncidents()
            ->with('category')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'incidents' => $incidents
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated=$request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'location_lat' => 'required|numeric|between:-90,90',
            'location_lng' => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();

        $incident = Incident::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category_id' => $validated['category_id'],
            'location_lat' => $validated['location_lat'],
            'location_lng' => $validated['location_lng'],
            'citizen_id' => $user->id,
            'priority' => 'Low',
            'status' => 'New',
        ]);

        return response()->json([
            'message' => 'Incident created successfully',
            'incident' => $incident ->load('category'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Incident $incident)
    {
        $user = $request->user();
        
        // Check if user owns this incident
        if ($incident->citizen_id !== $user->id) {
            return response()->json([
                'message' => 'You can only view your own incidents'
            ], 403);
        }
        
        return response()->json([
            'incident' => $incident->load('category')
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
        ]);
        
        $incident->update($validated);
        
        return response()->json([
            'message' => 'Incident updated successfully',
            'incident' => $incident->load('category')
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Incident $incident)
    {
        $user = $request->user();
        
        // Check if user owns this incident
        if ($incident->citizen_id !== $user->id) {
            return response()->json([
                'message' => 'You can only delete your own incidents'
            ], 403);
        }
        
        $incident->delete();
        
        return response()->json([
            'message' => 'Incident deleted successfully'
        ], 200);
    }

    /**
     * Assign incident to an agent (operators/admins only)
     */
    public function assign(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'agent_id' => 'required|exists:users,id',
        ]);
        $agent = User::find($validated['agent_id']);
        if ($agent->role !== 'agent') {
            return response()->json([
                'message' => 'User must be an agent to be assigned incidents'
            ], 400);
        }

        $incident->update([
            'assigned_agent_id' => $validated['agent_id'],
            'status' => 'Assigned'
        ]);

        return response()->json([
            'message' => 'Incident assigned successfully',
            'incident' => $incident->load(['category', 'citizen', 'assignedAgent'])
        ], 200);
    }

    public function updatePriority(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'priority' => 'required|in:Low,Medium,High'
        ]);

        $incident->update(['priority' => $validated['priority']]);

        return response()->json([
            'message' => 'Incident priority updated successfully',
            'incident' => $incident->load(['category', 'citizen', 'assignedAgent'])
        ], 200);
    }

    /**
     * Agent: list assigned incidents
     */
    public function assignedIncidents(Request $request)
    {
        $user = $request->user();

        $incidents = Incident::with(['category', 'citizen'])
            ->where('assigned_agent_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'incidents' => $incidents
        ], 200);
    }

    /**
     * Agent: update incident status
     */
    public function updateStatus(Request $request, Incident $incident)
    {
        $user = $request->user();

        if ($incident->assigned_agent_id !== $user->id) {
            return response()->json([
                'message' => 'Only the assigned agent can update status'
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:In Progress,Resolved,Unresolved'
        ]);

        $incident->update([
            'status' => $validated['status'],
            'resolved_at' => in_array($validated['status'], ['Resolved']) ? now() : null,
        ]);

        return response()->json([
            'message' => 'Incident status updated successfully',
            'incident' => $incident->load(['category', 'citizen', 'assignedAgent'])
        ], 200);
    }

    /**
     * Agent: add a progress note
     */
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

        return response()->json([
            'message' => 'Note added',
            'note' => $note
        ], 201);
    }

    public function uploadAttachment(Request $request, Incident $incident)
    {
        $user = $request->user();
        
        // Check if user owns this incident (citizens) or is assigned agent
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

        return response()->json([
            'message' => 'File uploaded successfully',
            'attachment' => $attachment
        ], 201);
    }

    /**
     * Get incident attachments
     */
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
        Storage::disk('public')->delete($attachment->storage_key);

        $attachment->delete();
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
}