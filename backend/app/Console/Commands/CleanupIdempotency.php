<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Idempotency;

class CleanupIdempotency extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'idempotency:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired idempotency records';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $deletedCount = Idempotency::cleanupExpired();
        
        $this->info("Cleaned up {$deletedCount} expired idempotency records.");
        
        return Command::SUCCESS;
    }
}
