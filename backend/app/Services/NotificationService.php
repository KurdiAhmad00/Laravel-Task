<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Incident;

class NotificationService
{
    /**
     * Create a notification for a user
     */
    public static function createNotification(int $userId, string $type, string $title, string $message, array $data = []): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data
        ]);
    }

    /**
     * Notify citizen when their incident is created
     */
    public static function notifyCitizenIncidentCreated(Incident $incident): void
    {
        $citizen = $incident->citizen;
        if (!$citizen) return;

        $title = "Incident Report Created";
        $message = "Your incident report '{$incident->title}' has been created successfully";
        
        self::createNotification(
            $citizen->id,
            'incident_created',
            $title,
            $message,
            [
                'incident_id' => $incident->id,
                'status' => $incident->status
            ]
        );
    }

    /**
     * Notify citizen when their incident status changes
     */
    public static function notifyCitizenStatusChange(Incident $incident, string $oldStatus, string $newStatus): void
    {
        $citizen = $incident->citizen;
        if (!$citizen) return;

        $title = "Incident Status Updated";
        $message = "Your incident '{$incident->title}' status has changed from '{$oldStatus}' to '{$newStatus}'";
        
        self::createNotification(
            $citizen->id,
            'incident_status_changed',
            $title,
            $message,
            [
                'incident_id' => $incident->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus
            ]
        );
    }

    /**
     * Notify agent when they get assigned a new incident
     */
    public static function notifyAgentAssignment(Incident $incident, User $agent): void
    {
        $title = "New Incident Assigned";
        $message = "You have been assigned incident '{$incident->title}' by an operator";
        
        self::createNotification(
            $agent->id,
            'incident_assigned',
            $title,
            $message,
            [
                'incident_id' => $incident->id,
                'citizen_name' => $incident->citizen->name ?? 'Unknown',
                'priority' => $incident->priority
            ]
        );
    }

    /**
     * Notify agent when they update an incident
     */
    public static function notifyAgentIncidentUpdated(Incident $incident, User $agent, string $action): void
    {
        $title = "Incident Report #{$incident->id} Updated";
        $message = "You have updated incident '{$incident->title}' - {$action}";
        
        self::createNotification(
            $agent->id,
            'incident_updated',
            $title,
            $message,
            [
                'incident_id' => $incident->id,
                'action' => $action,
                'status' => $incident->status
            ]
        );
    }

    /**
     * Notify operator when a new incident is created
     */
    public static function notifyOperatorNewIncident(Incident $incident): void
    {
        // Get all operators
        $operators = User::where('role', 'operator')->get();
        
        $title = "New Incident Report";
        $citizenName = $incident->citizen->name ?? 'Unknown';
        $message = "New incident '{$incident->title}' reported by {$citizenName} - needs assignment";
        
        foreach ($operators as $operator) {
            self::createNotification(
                $operator->id,
                'new_incident_created',
                $title,
                $message,
                [
                    'incident_id' => $incident->id,
                    'citizen_name' => $incident->citizen->name ?? 'Unknown',
                    'category' => $incident->category->name ?? 'Unknown',
                    'priority' => $incident->priority
                ]
            );
        }
    }

    /**
     * Notify operator when they assign an incident
     */
    public static function notifyOperatorIncidentAssigned(Incident $incident, User $operator, User $agent): void
    {
        $title = "Incident Report Assigned";
        $message = "Incident report #{$incident->id} assigned to {$agent->name}";
        
        self::createNotification(
            $operator->id,
            'incident_assigned_by_operator',
            $title,
            $message,
            [
                'incident_id' => $incident->id,
                'agent_name' => $agent->name,
                'agent_id' => $agent->id
            ]
        );
    }

    /**
     * Notify operator when incident priority changes
     */
    public static function notifyOperatorPriorityChange(Incident $incident, string $oldPriority, string $newPriority): void
    {
        // Get all operators
        $operators = User::where('role', 'operator')->get();
        
        $title = "Incident Priority Updated";
        $message = "Incident '{$incident->title}' priority changed from '{$oldPriority}' to '{$newPriority}'";
        
        foreach ($operators as $operator) {
            self::createNotification(
                $operator->id,
                'incident_priority_changed',
                $title,
                $message,
                [
                    'incident_id' => $incident->id,
                    'old_priority' => $oldPriority,
                    'new_priority' => $newPriority
                ]
            );
        }
    }
}
