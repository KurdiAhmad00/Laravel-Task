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
use App\Models\Category;

class ProcessCsvImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 1800; // 30 minutes for large files
    public $tries = 3;

    protected $filePath;
    protected $operatorId;
    protected $importId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $filePath, int $operatorId, string $importId = null)
    {
        $this->filePath = $filePath;
        $this->operatorId = $operatorId;
        $this->importId = $importId ?? uniqid('import_');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Starting CSV import processing", [
                'file_path' => $this->filePath,
                'operator_id' => $this->operatorId,
                'import_id' => $this->importId
            ]);

            $results = $this->processCsvFile();
            
            Log::info("CSV import processing completed", [
                'import_id' => $this->importId,
                'success_count' => $results['success'],
                'error_count' => $results['errors'],
                'total_rows' => $results['total']
            ]);

            // Store results in cache or database for the frontend to retrieve
            cache()->put("csv_import_results_{$this->importId}", $results, 3600); // 1 hour

        } catch (\Exception $e) {
            Log::error("CSV import processing failed", [
                'import_id' => $this->importId,
                'error' => $e->getMessage(),
                'file_path' => $this->filePath
            ]);
            
            throw $e;
        }
    }

    /**
     * Process the CSV file
     */
    private function processCsvFile(): array
    {
        $results = [
            'success' => 0,
            'errors' => 0,
            'total' => 0,
            'error_details' => []
        ];

        if (!Storage::exists($this->filePath)) {
            throw new \Exception("CSV file not found: {$this->filePath}");
        }

        // Use streaming instead of loading entire file into memory
        $handle = fopen(Storage::path($this->filePath), 'r');
        
        if (!$handle) {
            throw new \Exception("Could not open CSV file for reading");
        }

        // Skip header row
        fgetcsv($handle);
        
        $rowNumber = 1; 
        
        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            $results['total']++;
            
            // Update every 100 rows
            if ($results['total'] % 1000 === 0) {
                $this->updateProgress($results);
            }

            try {
                $this->processCsvRow($row, $rowNumber);
                $results['success']++;
            } catch (\Exception $e) {
                $results['errors']++;
                $results['error_details'][] = [
                    'row' => $rowNumber,
                    'error' => $e->getMessage(),
                    'data' => $row
                ];
            }
        }

        fclose($handle);
        
        // Final progress update
        $this->updateProgress($results);

        // Clean up the uploaded file
        Storage::delete($this->filePath);

        return $results;
    }

    /**
     * Update progress in cache for frontend to track
     */
    private function updateProgress(array $results): void
    {
        $progress = [
            'import_id' => $this->importId,
            'status' => 'processing',
            'processed' => $results['total'],
            'success' => $results['success'],
            'errors' => $results['errors'],
            'updated_at' => now()->toISOString()
        ];
        
        cache()->put("csv_import_progress_{$this->importId}", $progress, 3600);
    }

    /**
     * Process a single CSV row
     */
    private function processCsvRow(array $row, int $rowNumber): void
    {
        // Validate required fields
        if (count($row) < 8) {
            throw new \Exception("Insufficient data in row");
        }

        $data = [
            'title' => $row[0] ?? '',
            'description' => $row[1] ?? '',
            'category_id' => (int)($row[2] ?? 0),
            'location_lat' => (float)($row[3] ?? 0),
            'location_lng' => (float)($row[4] ?? 0),
            'citizen_username' => $row[5] ?? '',
            'priority' => $row[6] ?? 'medium',
            'status' => $row[7] ?? 'new'
        ];

        // Validate data
        if (empty($data['title'])) {
            throw new \Exception("Title is required");
        }

        if (empty($data['description'])) {
            throw new \Exception("Description is required");
        }

        if (!Category::find($data['category_id'])) {
            throw new \Exception("Invalid category ID: {$data['category_id']}");
        }

        // Find or create citizen
        $citizen = User::where('username', $data['citizen_username'])
            ->where('role', 'citizen')
            ->first();

        if (!$citizen) {
            $citizen = User::create([
                'username' => $data['citizen_username'],
                'email' => null,
                'password' => null,
                'role' => 'citizen',
                'status' => 'active'
            ]);
        }

        // Create incident
        Incident::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'category_id' => $data['category_id'],
            'location_lat' => $data['location_lat'],
            'location_lng' => $data['location_lng'],
            'citizen_id' => $citizen->id,
            'priority' => $data['priority'],
            'status' => $data['status'],
            'assigned_agent_id' => null
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("ProcessCsvImport job failed permanently", [
            'import_id' => $this->importId,
            'file_path' => $this->filePath,
            'error' => $exception->getMessage()
        ]);

        // Clean up the uploaded file
        if (Storage::exists($this->filePath)) {
            Storage::delete($this->filePath);
        }
    }
}