<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Incident;
use App\Models\IncidentNote;
use App\Models\Attachment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class IncidentSeeder extends Seeder
{
    public function run()
    {
        // Get existing users
        $citizen = User::where('email', 'citizen@test.com')->first();
        $operator = User::where('email', 'operator@test.com')->first();
        $agent = User::where('email', 'agent@test.com')->first();

        if (!$citizen || !$operator || !$agent) {
            $this->command->error('Required users not found. Please run UserSeeder first.');
            return;
        }

        // Get categories (assuming they exist from CategorySeeder)
        $categories = DB::table('categories')->pluck('id', 'name')->toArray();
        
        // Sample incident data using available categories
        $incidents = [
            [
                'title' => 'Broken Streetlight on Main Street',
                'description' => 'Streetlight #47 on Main Street has been flickering for 3 days and finally went out completely last night. This is a safety concern for pedestrians.',
                'category_id' => 1, // Street Lighting
                'priority' => 'High',
                'status' => 'In Progress',
                'location_lat' => 40.7128,
                'location_lng' => -74.0060,
                'assigned_agent_id' => $agent->id,
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(2),
            ],
            [
                'title' => 'Pothole on Oak Avenue',
                'description' => 'Large pothole has formed on Oak Avenue near the intersection with Pine Street. It\'s getting deeper and could damage vehicles.',
                'category_id' => 2, // Road Damage
                'priority' => 'Medium',
                'status' => 'Assigned',
                'location_lat' => 40.7589,
                'location_lng' => -73.9851,
                'assigned_agent_id' => $agent->id,
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(1),
            ],
            [
                'title' => 'Water Leak on Elm Street',
                'description' => 'Water is leaking from a broken pipe near the sidewalk on Elm Street. Water is pooling and creating a hazard.',
                'category_id' => 3, // Water Issues
                'priority' => 'High',
                'status' => 'Resolved',
                'location_lat' => 40.7505,
                'location_lng' => -73.9934,
                'assigned_agent_id' => $agent->id,
                'resolved_at' => now()->subHours(2),
                'created_at' => now()->subDays(7),
                'updated_at' => now()->subHours(2),
            ],
            [
                'title' => 'Damaged Traffic Sign',
                'description' => 'Stop sign at the corner of Maple and Cedar is bent and partially obscured by tree branches.',
                'category_id' => 4, // Traffic Signs
                'priority' => 'Medium',
                'status' => 'Assigned',
                'location_lat' => 40.7614,
                'location_lng' => -73.9776,
                'assigned_agent_id' => $agent->id,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subHours(12),
            ],
            [
                'title' => 'Broken Streetlight on Park Avenue',
                'description' => 'Another streetlight on Park Avenue has gone out, making the area very dark at night.',
                'category_id' => 1, // Street Lighting
                'priority' => 'High',
                'status' => 'In Progress',
                'location_lat' => 40.7489,
                'location_lng' => -73.9857,
                'assigned_agent_id' => $agent->id,
                'created_at' => now()->subDays(4),
                'updated_at' => now()->subHours(4),
            ],
            [
                'title' => 'Large Pothole on First Street',
                'description' => 'Several concrete slabs on the sidewalk are cracked and uneven, creating a tripping hazard for pedestrians.',
                'category_id' => 2, // Road Damage
                'priority' => 'Medium',
                'status' => 'New',
                'location_lat' => 40.7505,
                'location_lng' => -73.9934,
                'assigned_agent_id' => null,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ],
            [
                'title' => 'Water Main Break',
                'description' => 'Water main has burst on Main Street, flooding the area and affecting water pressure.',
                'category_id' => 3, // Water Issues
                'priority' => 'High',
                'status' => 'Resolved',
                'location_lat' => 40.7589,
                'location_lng' => -73.9851,
                'assigned_agent_id' => $agent->id,
                'resolved_at' => now()->subDays(1),
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(1),
            ],
            [
                'title' => 'Missing Stop Sign',
                'description' => 'Stop sign at the intersection of Oak and Pine has been knocked down by a vehicle.',
                'category_id' => 4, // Traffic Signs
                'priority' => 'High',
                'status' => 'New',
                'location_lat' => 40.7282,
                'location_lng' => -73.7949,
                'assigned_agent_id' => null,
                'created_at' => now()->subHours(6),
                'updated_at' => now()->subHours(6),
            ],
        ];

        foreach ($incidents as $incidentData) {
            // Create the incident
            $incident = Incident::create([
                'citizen_id' => $citizen->id,
                'title' => $incidentData['title'],
                'description' => $incidentData['description'],
                'category_id' => $incidentData['category_id'],
                'priority' => $incidentData['priority'],
                'status' => $incidentData['status'],
                'location_lat' => $incidentData['location_lat'],
                'location_lng' => $incidentData['location_lng'],
                'assigned_agent_id' => $incidentData['assigned_agent_id'],
                'resolved_at' => $incidentData['resolved_at'] ?? null,
                'created_at' => $incidentData['created_at'],
                'updated_at' => $incidentData['updated_at'],
            ]);

            // Add notes for incidents that are in progress or resolved
            if (in_array($incident->status, ['In Progress', 'Resolved'])) {
                // Add assignment note (by operator)
                IncidentNote::create([
                    'incident_id' => $incident->id,
                    'user_id' => $operator->id,
                    'body' => "Incident assigned to {$agent->name} for investigation and resolution.",
                    'created_at' => $incident->created_at->addMinutes(30),
                ]);

                // Add progress note (by agent)
                if ($incident->status === 'In Progress') {
                    IncidentNote::create([
                        'incident_id' => $incident->id,
                        'user_id' => $agent->id,
                        'body' => "Started investigation. Initial assessment completed. Working on solution.",
                        'created_at' => $incident->created_at->addHours(2),
                    ]);
                } elseif ($incident->status === 'Resolved') {
                    IncidentNote::create([
                        'incident_id' => $incident->id,
                        'user_id' => $agent->id,
                        'body' => "Issue has been resolved. All necessary repairs completed and verified.",
                        'created_at' => $incident->updated_at->subMinutes(30),
                    ]);
                }
            }

            // Add some sample attachments for a few incidents
            if (in_array($incident->title, ['Broken Streetlight on Main Street', 'Pothole on Oak Avenue', 'Water Leak on Elm Street'])) {
                // Create sample attachment records (without actual files)
                Attachment::create([
                    'incident_id' => $incident->id,
                    'filename' => 'incident_photo_1.jpg',
                    'content_type' => 'image/jpeg',
                    'size_bytes' => 245760, // ~240KB
                    'storage_key' => 'incidents/' . $incident->id . '/incident_photo_1.jpg',
                    'created_at' => $incident->created_at->addMinutes(15),
                ]);

                if ($incident->title === 'Water Leak on Elm Street') {
                    Attachment::create([
                        'incident_id' => $incident->id,
                        'filename' => 'repair_document.pdf',
                        'content_type' => 'application/pdf',
                        'size_bytes' => 512000, // ~500KB
                        'storage_key' => 'incidents/' . $incident->id . '/repair_document.pdf',
                        'created_at' => $incident->created_at->addHours(1),
                    ]);
                }
            }
        }

        $this->command->info('Created ' . count($incidents) . ' sample incidents with relationships.');
    }
}