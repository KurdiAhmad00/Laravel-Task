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
        
        // Convert time_value (minutes) to appropriate Laravel Limit method
        switch ($rateLimit->time_unit) {
            case 'minute':
                return Limit::perMinute($rateLimit->time_value)->by($rateLimit->max_attempts);
            case 'hour':
                return Limit::perHour($rateLimit->time_value / 60)->by($rateLimit->max_attempts);
            case 'day':
                return Limit::perDay($rateLimit->time_value / 1440)->by($rateLimit->max_attempts);
            default:
                return Limit::perHour(1)->by($rateLimit->max_attempts);
        }
    }
}