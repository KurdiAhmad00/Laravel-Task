<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AuditLog;
use App\Models\Incident;
use App\Models\User;

class AuditLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some incidents and users to create audit logs
        $incidents = Incident::with(['citizen', 'assignedAgent'])->take(5)->get();
        $users = User::all();

        if ($incidents->isEmpty() || $users->isEmpty()) {
            $this->command->info('No incidents or users found. Skipping audit log seeding.');
            return;
        }

        $actions = [
            'created',
            'updated',
            'assigned',
            'status_changed',
            'priority_changed',
            'resolved',
            'note_added',
            'attachment_added'
        ];

        foreach ($incidents as $incident) {
            // Create a "created" log
            AuditLog::create([
                'incident_id' => $incident->id,
                'actor_id' => $incident->citizen_id,
                'action' => 'created',
                'old_values' => null,
                'new_values' => json_encode([
                    'title' => $incident->title,
                    'description' => substr($incident->description, 0, 100) . '...',
                    'status' => $incident->status,
                    'priority' => $incident->priority
                ])
            ]);

            // Create some random activity logs
            $randomActions = collect($actions)->random(rand(2, 4));
            
            foreach ($randomActions as $action) {
                $oldValues = null;
                $newValues = null;
                
                switch ($action) {
                    case 'assigned':
                        if ($incident->assigned_agent_id) {
                            $oldValues = json_encode(['assigned_agent_id' => null]);
                            $newValues = json_encode(['assigned_agent_id' => $incident->assigned_agent_id]);
                        }
                        break;
                    case 'status_changed':
                        $statuses = ['New', 'Assigned', 'In Progress', 'Resolved', 'Unresolved'];
                        $oldStatus = $statuses[array_rand($statuses)];
                        $newStatus = $statuses[array_rand($statuses)];
                        if ($oldStatus !== $newStatus) {
                            $oldValues = json_encode(['status' => $oldStatus]);
                            $newValues = json_encode(['status' => $newStatus]);
                        }
                        break;
                    case 'priority_changed':
                        $priorities = ['Low', 'Medium', 'High'];
                        $oldPriority = $priorities[array_rand($priorities)];
                        $newPriority = $priorities[array_rand($priorities)];
                        if ($oldPriority !== $newPriority) {
                            $oldValues = json_encode(['priority' => $oldPriority]);
                            $newValues = json_encode(['priority' => $newPriority]);
                        }
                        break;
                    case 'updated':
                        $oldValues = json_encode(['description' => 'Original description...']);
                        $newValues = json_encode(['description' => 'Updated description with more details...']);
                        break;
                    case 'note_added':
                        $newValues = json_encode(['note' => 'Added a progress note to track the incident status.']);
                        break;
                    case 'attachment_added':
                        $newValues = json_encode(['attachment' => 'document.pdf']);
                        break;
                }

                if ($oldValues || $newValues) {
                    AuditLog::create([
                        'incident_id' => $incident->id,
                        'actor_id' => $users->random()->id,
                        'action' => $action,
                        'old_values' => $oldValues,
                        'new_values' => $newValues,
                        'created_at' => now()->subDays(rand(1, 30))->subHours(rand(0, 23))
                    ]);
                }
            }
        }

        $this->command->info('Audit logs seeded successfully!');
    }
}
