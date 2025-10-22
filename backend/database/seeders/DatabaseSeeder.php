<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ensure categories are seeded
        $this->call(\Database\Seeders\CategorySeeder::class);
        
        // Create test users
        $this->call(\Database\Seeders\TestUsersSeeder::class);
        
        // Create sample audit logs
        $this->call(\Database\Seeders\AuditLogSeeder::class);
        
        // Create rate limits
        $this->call(\Database\Seeders\RateLimitSeeder::class);
    }
}
