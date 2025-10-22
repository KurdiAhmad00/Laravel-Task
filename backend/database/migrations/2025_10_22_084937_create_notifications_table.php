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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            // 'incident_created', 'incident_assigned', 'status_changed', 'priority_changed', 'note_added', 'user_deleted', 'category_created', etc.
            $table->string('type'); 
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); 
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['user_id', 'read_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};