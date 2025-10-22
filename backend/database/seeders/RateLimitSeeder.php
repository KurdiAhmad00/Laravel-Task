<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\RateLimit;

class RateLimitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rateLimits = [
            [
                'name' => 'login',
                'max_attempts' => 5,
                'time_unit' => 'hour',
                'time_value' => 60, // 60 minutes = 1 hour
                'description' => 'Login attempts per hour',
                'is_active' => true,
            ],
            [
                'name' => 'api',
                'max_attempts' => 100,
                'time_unit' => 'hour',
                'time_value' => 60, // 60 minutes = 1 hour
                'description' => 'API requests per hour',
                'is_active' => true,
            ],
            [
                'name' => 'incident-creation',
                'max_attempts' => 10,
                'time_unit' => 'hour',
                'time_value' => 60, // 60 minutes = 1 hour
                'description' => 'Incident creation per hour',
                'is_active' => true,
            ],
            [
                'name' => 'file-upload',
                'max_attempts' => 20,
                'time_unit' => 'hour',
                'time_value' => 60, // 60 minutes = 1 hour
                'description' => 'File uploads per hour',
                'is_active' => true,
            ],
            [
                'name' => 'csv-import',
                'max_attempts' => 5,
                'time_unit' => 'day',
                'time_value' => 1440, // 1440 minutes = 1 day
                'description' => 'CSV imports per day',
                'is_active' => true,
            ],
        ];

        foreach ($rateLimits as $rateLimit) {
            RateLimit::updateOrCreate(
                ['name' => $rateLimit['name']],
                $rateLimit
            );
        }
    }
}