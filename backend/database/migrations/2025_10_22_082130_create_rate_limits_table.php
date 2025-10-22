<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rate_limits', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // 'login', 'api', 'incident-creation', etc.
            $table->integer('max_attempts'); // 5, 100, 10, etc.
            $table->string('time_unit'); // 'minute', 'hour', 'day'
            $table->integer('time_value'); // 1, 60, 1440 (minutes)
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rate_limits');
    }
};