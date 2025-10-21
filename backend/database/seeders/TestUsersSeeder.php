<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test users for each role
        $users = [
            [
                'name' => 'John Citizen',
                'email' => 'citizen@test.com',
                'password' => Hash::make('password'),
                'role' => 'citizen',
            ],
            [
                'name' => 'Sarah Agent',
                'email' => 'agent@test.com',
                'password' => Hash::make('password'),
                'role' => 'agent',
            ],
            [
                'name' => 'Mike Admin',
                'email' => 'admin@test.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ],
            [
                'name' => 'Lisa Operator',
                'email' => 'operator@test.com',
                'password' => Hash::make('password'),
                'role' => 'operator',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        $this->command->info('Test users created successfully!');
        $this->command->info('Citizen: citizen@test.com / password');
        $this->command->info('Agent: agent@test.com / password');
        $this->command->info('Admin: admin@test.com / password');
        $this->command->info('Operator: operator@test.com / password');
    }
}
