<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Street Lighting',
                'description' => 'Issues with street lights, broken bulbs, etc.',
                'is_active' => true,
            ],
            [
                'name' => 'Road Damage',
                'description' => 'Potholes, cracks, road surface issues',
                'is_active' => true,
            ],
            [
                'name' => 'Water Issues',
                'description' => 'Water leaks, drainage problems, flooding',
                'is_active' => true,
            ],
            [
                'name' => 'Traffic Signs',
                'description' => 'Missing, damaged, or unclear traffic signs',
                'is_active' => true,
            ],
            [
                'name' => 'Public Safety',
                'description' => 'Safety hazards, dangerous conditions',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            \App\Models\Category::create($category);
        }
    }
}
