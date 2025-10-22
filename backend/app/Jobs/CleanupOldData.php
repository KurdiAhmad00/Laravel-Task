<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\AuditLog;
use App\Models\Incident;
use Carbon\Carbon;

class CleanupOldData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 2;

    protected $cleanupType;
    protected $retentionDays;

    /**
     * Create a new job instance.
     */
    public function __construct(string $cleanupType, int $retentionDays = 90)
    {
        $this->cleanupType = $cleanupType;
        $this->retentionDays = $retentionDays;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Starting data cleanup", [
                'cleanup_type' => $this->cleanupType,
                'retention_days' => $this->retentionDays
            ]);

            $results = match($this->cleanupType) {
                'audit_logs' => $this->cleanupAuditLogs(),
                'old_incidents' => $this->cleanupOldIncidents(),
                'temp_files' => $this->cleanupTempFiles(),
                'all' => $this->cleanupAll(),
                default => throw new \Exception("Unknown cleanup type: {$this->cleanupType}")
            };
            
            Log::info("Data cleanup completed", [
                'cleanup_type' => $this->cleanupType,
                'results' => $results
            ]);

        } catch (\Exception $e) {
            Log::error("Data cleanup failed", [
                'cleanup_type' => $this->cleanupType,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * Cleanup old audit logs
     */
    private function cleanupAuditLogs(): array
    {
        $cutoffDate = Carbon::now()->subDays($this->retentionDays);
        
        $deletedCount = AuditLog::where('created_at', '<', $cutoffDate)->delete();
        
        return [
            'type' => 'audit_logs',
            'deleted_count' => $deletedCount,
            'cutoff_date' => $cutoffDate->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Cleanup old resolved incidents
     */
    private function cleanupOldIncidents(): array
    {
        $cutoffDate = Carbon::now()->subDays($this->retentionDays);
        
        // Only delete resolved incidents older than retention period
        $deletedCount = Incident::where('status', 'resolved')
            ->where('updated_at', '<', $cutoffDate)
            ->delete();
        
        return [
            'type' => 'old_incidents',
            'deleted_count' => $deletedCount,
            'cutoff_date' => $cutoffDate->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Cleanup temporary files
     */
    private function cleanupTempFiles(): array
    {
        $tempDirectories = ['temp', 'uploads/temp', 'reports'];
        $deletedFiles = 0;
        $deletedSize = 0;
        
        foreach ($tempDirectories as $directory) {
            if (Storage::exists($directory)) {
                $files = Storage::allFiles($directory);
                
                foreach ($files as $file) {
                    $fileAge = Carbon::createFromTimestamp(Storage::lastModified($file));
                    
                    // Delete files older than 7 days
                    if ($fileAge->isBefore(Carbon::now()->subDays(7))) {
                        $fileSize = Storage::size($file);
                        Storage::delete($file);
                        $deletedFiles++;
                        $deletedSize += $fileSize;
                    }
                }
            }
        }
        
        return [
            'type' => 'temp_files',
            'deleted_files' => $deletedFiles,
            'deleted_size_bytes' => $deletedSize,
            'deleted_size_mb' => round($deletedSize / 1024 / 1024, 2)
        ];
    }

    /**
     * Cleanup all data types
     */
    private function cleanupAll(): array
    {
        $results = [];
        
        $results[] = $this->cleanupAuditLogs();
        $results[] = $this->cleanupOldIncidents();
        $results[] = $this->cleanupTempFiles();
        
        return $results;
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("CleanupOldData job failed permanently", [
            'cleanup_type' => $this->cleanupType,
            'error' => $exception->getMessage()
        ]);
    }
}