<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Cache\RateLimiting\Limit; 
class RateLimit extends Model
{
    protected $fillable = [
        'name',
        'max_attempts',
        'time_unit',
        'time_value',
        'description',
        'is_active'
    ];
    public static function getRateLimit($name)
    {
        $rateLimit = self::where('name', $name)->where('is_active', true)->first();
        
        if (!$rateLimit) {
            return null;
        }
        
        // Convert time_value to appropriate Laravel Limit method
        switch ($rateLimit->time_unit) {
            case 'minute':
                return Limit::perMinutes($rateLimit->time_value, $rateLimit->max_attempts);
            case 'hour':
                return Limit::perMinutes($rateLimit->time_value * 60, $rateLimit->max_attempts);
            case 'day':
                return Limit::perMinutes($rateLimit->time_value * 1440, $rateLimit->max_attempts);
            default:
                return Limit::perHour($rateLimit->max_attempts);
        }
    }
}