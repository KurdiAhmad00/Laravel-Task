<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Models\Incident;
use App\Models\User;

class SendIncidentNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 60;
    public $tries = 3;

    protected $incident;
    protected $notificationType;
    protected $recipientEmail;
    protected $recipientName;

    /**
     * Create a new job instance.
     */
    public function __construct(Incident $incident, string $notificationType, string $recipientEmail, string $recipientName)
    {
        $this->incident = $incident;
        $this->notificationType = $notificationType;
        $this->recipientEmail = $recipientEmail;
        $this->recipientName = $recipientName;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $subject = $this->getSubject();
            $message = $this->getMessage();

            // In a real application, use a proper mail class
            // For now, just log the notification
            Log::info("Email Notification Sent", [
                'to' => $this->recipientEmail,
                'subject' => $subject,
                'incident_id' => $this->incident->id,
                'type' => $this->notificationType
            ]);

            // Simulate email sending delay
            sleep(1);

        } catch (\Exception $e) {
            Log::error("Failed to send incident notification", [
                'error' => $e->getMessage(),
                'incident_id' => $this->incident->id,
                'recipient' => $this->recipientEmail
            ]);
            
            throw $e;
        }
    }

    /**
     * Get the subject line for the email
     */
    private function getSubject(): string
    {
        return match($this->notificationType) {
            'created' => "New Incident Created: {$this->incident->title}",
            'assigned' => "Incident Assigned to You: {$this->incident->title}",
            'status_changed' => "Incident Status Updated: {$this->incident->title}",
            'resolved' => "Incident Resolved: {$this->incident->title}",
            default => "Incident Update: {$this->incident->title}"
        };
    }

    /**
     * Get the message content for the email
     */
    private function getMessage(): string
    {
        $baseMessage = "Hello {$this->recipientName},\n\n";
        $incidentDetails = "Incident: {$this->incident->title}\n";
        $incidentDetails .= "Description: {$this->incident->description}\n";
        $incidentDetails .= "Status: " . ucfirst($this->incident->status) . "\n";
        $incidentDetails .= "Priority: " . ucfirst($this->incident->priority) . "\n";
        $incidentDetails .= "Created: {$this->incident->created_at->format('M d, Y H:i')}\n\n";

        return match($this->notificationType) {
            'created' => $baseMessage . "A new incident has been created and requires your attention.\n\n" . $incidentDetails,
            'assigned' => $baseMessage . "An incident has been assigned to you for resolution.\n\n" . $incidentDetails,
            'status_changed' => $baseMessage . "The status of an incident has been updated.\n\n" . $incidentDetails,
            'resolved' => $baseMessage . "An incident has been marked as resolved.\n\n" . $incidentDetails,
            default => $baseMessage . "There has been an update to an incident.\n\n" . $incidentDetails
        };
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("SendIncidentNotification job failed permanently", [
            'incident_id' => $this->incident->id,
            'recipient' => $this->recipientEmail,
            'error' => $exception->getMessage()
        ]);
    }
}