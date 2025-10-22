<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\Incident;
use App\Models\User;
use App\Models\AuditLog;

class GenerateSystemReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes
    public $tries = 2;

    protected $reportType;
    protected $dateFrom;
    protected $dateTo;
    protected $adminId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $reportType, string $dateFrom, string $dateTo, int $adminId)
    {
        $this->reportType = $reportType;
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->adminId = $adminId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Starting system report generation", [
                'report_type' => $this->reportType,
                'date_from' => $this->dateFrom,
                'date_to' => $this->dateTo,
                'admin_id' => $this->adminId
            ]);

            $reportData = $this->generateReportData();
            $reportPath = $this->saveReport($reportData);
            
            Log::info("System report generated successfully", [
                'report_type' => $this->reportType,
                'file_path' => $reportPath,
                'admin_id' => $this->adminId
            ]);

            // Store report info in cache for the admin to download
            cache()->put("system_report_{$this->adminId}_{$this->reportType}", [
                'path' => $reportPath,
                'generated_at' => now(),
                'type' => $this->reportType
            ], 7200); // 2 hours

        } catch (\Exception $e) {
            Log::error("System report generation failed", [
                'report_type' => $this->reportType,
                'error' => $e->getMessage(),
                'admin_id' => $this->adminId
            ]);
            
            throw $e;
        }
    }

    /**
     * Generate the report data
     */
    private function generateReportData(): array
    {
        $dateFrom = \Carbon\Carbon::parse($this->dateFrom);
        $dateTo = \Carbon\Carbon::parse($this->dateTo);

        return match($this->reportType) {
            'incidents' => $this->generateIncidentsReport($dateFrom, $dateTo),
            'users' => $this->generateUsersReport($dateFrom, $dateTo),
            'audit' => $this->generateAuditReport($dateFrom, $dateTo),
            'system' => $this->generateSystemStatsReport($dateFrom, $dateTo),
            default => throw new \Exception("Unknown report type: {$this->reportType}")
        };
    }

    /**
     * Generate incidents report
     */
    private function generateIncidentsReport($dateFrom, $dateTo): array
    {
        $incidents = Incident::whereBetween('created_at', [$dateFrom, $dateTo])
            ->with(['citizen', 'assignedAgent', 'category'])
            ->get();

        $statusCounts = $incidents->groupBy('status')->map->count();
        $priorityCounts = $incidents->groupBy('priority')->map->count();
        $categoryCounts = $incidents->groupBy('category.name')->map->count();

        return [
            'type' => 'incidents',
            'period' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d')
            ],
            'summary' => [
                'total_incidents' => $incidents->count(),
                'status_breakdown' => $statusCounts,
                'priority_breakdown' => $priorityCounts,
                'category_breakdown' => $categoryCounts
            ],
            'incidents' => $incidents->map(function ($incident) {
                return [
                    'id' => $incident->id,
                    'title' => $incident->title,
                    'status' => $incident->status,
                    'priority' => $incident->priority,
                    'citizen' => $incident->citizen->username ?? 'Unknown',
                    'assigned_agent' => $incident->assignedAgent->username ?? 'Unassigned',
                    'category' => $incident->category->name ?? 'Unknown',
                    'created_at' => $incident->created_at->format('Y-m-d H:i:s')
                ];
            })
        ];
    }

    /**
     * Generate users report
     */
    private function generateUsersReport($dateFrom, $dateTo): array
    {
        $users = User::whereBetween('created_at', [$dateFrom, $dateTo])->get();
        $roleCounts = $users->groupBy('role')->map->count();

        return [
            'type' => 'users',
            'period' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d')
            ],
            'summary' => [
                'total_users' => $users->count(),
                'role_breakdown' => $roleCounts
            ],
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at->format('Y-m-d H:i:s')
                ];
            })
        ];
    }

    /**
     * Generate audit report
     */
    private function generateAuditReport($dateFrom, $dateTo): array
    {
        $auditLogs = AuditLog::whereBetween('created_at', [$dateFrom, $dateTo])
            ->with(['actor', 'incident'])
            ->get();

        $actionCounts = $auditLogs->groupBy('action')->map->count();
        $entityTypeCounts = $auditLogs->groupBy('entity_type')->map->count();

        return [
            'type' => 'audit',
            'period' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d')
            ],
            'summary' => [
                'total_actions' => $auditLogs->count(),
                'action_breakdown' => $actionCounts,
                'entity_type_breakdown' => $entityTypeCounts
            ],
            'audit_logs' => $auditLogs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'entity_type' => $log->entity_type,
                    'actor' => $log->actor->username ?? 'System',
                    'incident_id' => $log->incident_id,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s')
                ];
            })
        ];
    }

    /**
     * Generate system stats report
     */
    private function generateSystemStatsReport($dateFrom, $dateTo): array
    {
        $totalIncidents = Incident::count();
        $totalUsers = User::count();
        $totalAuditLogs = AuditLog::count();
        $recentIncidents = Incident::whereBetween('created_at', [$dateFrom, $dateTo])->count();
        $recentUsers = User::whereBetween('created_at', [$dateFrom, $dateTo])->count();

        return [
            'type' => 'system',
            'period' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d')
            ],
            'summary' => [
                'total_incidents' => $totalIncidents,
                'total_users' => $totalUsers,
                'total_audit_logs' => $totalAuditLogs,
                'recent_incidents' => $recentIncidents,
                'recent_users' => $recentUsers
            ]
        ];
    }

    /**
     * Save the report to a file
     */
    private function saveReport(array $data): string
    {
        $filename = "report_{$this->reportType}_{$this->dateFrom}_{$this->dateTo}_" . now()->format('Y_m_d_H_i_s') . '.json';
        $path = "reports/{$filename}";
        
        Storage::put($path, json_encode($data, JSON_PRETTY_PRINT));
        
        return $path;
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("GenerateSystemReport job failed permanently", [
            'report_type' => $this->reportType,
            'admin_id' => $this->adminId,
            'error' => $exception->getMessage()
        ]);
    }
}