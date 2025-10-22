<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $perPage = $request->get('per_page', 15);
        
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
            
        return response()->json($notifications);
    }

    /**
     * Get unread notifications count.
     */
    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();
        $count = Notification::where('user_id', $user->id)
            ->unread()
            ->count();
            
        return response()->json(['count' => $count]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead($id): JsonResponse
    {
        $user = Auth::user();
        $notification = Notification::where('user_id', $user->id)
            ->where('id', $id)
            ->first();
            
        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }
        
        $notification->markAsRead();
        
        return response()->json(['message' => 'Notification marked as read']);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();
        Notification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);
            
        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Clear all notifications for the user.
     */
    public function clearAll(): JsonResponse
    {
        $user = Auth::user();
        $deleted = Notification::clearAllForUser($user->id);
        
        return response()->json([
            'message' => 'All notifications cleared',
            'deleted_count' => $deleted
        ]);
    }

    /**
     * Clear only read notifications for the user.
     */
    public function clearRead(): JsonResponse
    {
        $user = Auth::user();
        $deleted = Notification::clearReadForUser($user->id);
        
        return response()->json([
            'message' => 'Read notifications cleared',
            'deleted_count' => $deleted
        ]);
    }
}
