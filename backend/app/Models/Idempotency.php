<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Idempotency extends Model
{
    protected $table = 'idempotency';
    
    protected $fillable = [
        'request_key',
        'response_hash',
        'response_data',
        'expires_at'
    ];

    protected $casts = [
        'response_data' => 'array',
        'expires_at' => 'datetime'
    ];

    /**
     * Check if a request key exists and is not expired
     */
    public static function isValid($requestKey)
    {
        return self::where('request_key', $requestKey)
            ->where('expires_at', '>', now())
            ->exists();
    }

    /**
     * Get cached response for a request key
     */
    public static function getCachedResponse($requestKey)
    {
        $record = self::where('request_key', $requestKey)
            ->where('expires_at', '>', now())
            ->first();

        return $record ? $record->response_data : null;
    }

    /**
     * Store a response for a request key
     */
    public static function storeResponse($requestKey, $responseData, $expirationMinutes = 60)
    {
        $responseHash = hash('sha256', json_encode($responseData));
        
        return self::updateOrCreate(
            ['request_key' => $requestKey],
            [
                'response_hash' => $responseHash,
                'response_data' => $responseData,
                'expires_at' => now()->addMinutes($expirationMinutes)
            ]
        );
    }

    /**
     * Clean up expired records
     */
    public static function cleanupExpired()
    {
        return self::where('expires_at', '<', now())->delete();
    }
}
