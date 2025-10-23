<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use App\Models\RateLimit;

class RouteServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->configureRateLimiting();
    }

    protected function configureRateLimiting()
    {
        //Limit for API Requests
        RateLimiter::for ('api', function (Request $request) {
            $rateLimit = RateLimit::getRateLimit('api');
            return $rateLimit ?: Limit::perHour(10000)->by(optional($request->user())->id ?: $request->ip());
        });
        //Limit for Incident Creation
        RateLimiter::for('incident-creation', function (Request $request) {
            $rateLimit = RateLimit::getRateLimit('incident-creation');
            return $rateLimit ?: Limit::perHour(1000)->by(optional($request->user())->id ?: $request->ip());
        });
        //Limit for File Upload
        RateLimiter::for('file-upload', function (Request $request) {
            $rateLimit = RateLimit::getRateLimit('file-upload');
            return $rateLimit ?: Limit::perHour(2000)->by(optional($request->user())->id ?: $request->ip());
        });
        //Limit for CSV Import
        RateLimiter::for('csv-import', function (Request $request) {
            $rateLimit = RateLimit::getRateLimit('csv-import');
            return $rateLimit ?: Limit::perHour(100)->by(optional($request->user())->id ?: $request->ip());
        });
    }
    
}