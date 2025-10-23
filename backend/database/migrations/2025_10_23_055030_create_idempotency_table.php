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
        Schema::create('idempotency', function (Blueprint $table) {
            $table->id();
            $table->string('request_key')->unique();
            $table->text('response_hash');
            $table->json('response_data')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
            
            $table->index(['request_key', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('idempotency');
    }
};
