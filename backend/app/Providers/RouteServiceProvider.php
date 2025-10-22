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
        //Limit for Login Attempts
        RateLimiter::for('login', function (Request $request) {
            $rateLimit = RateLimit::getRateLimit('login');
            return $rateLimit ?: Limit::perHour(5)->by($request->ip());
        });
        //Limit for API Requests
        RateLimiter::for ('api', function (Request $request) {
            $rateLimit = RateLimit::getRateLimit('api');
            return $rateLimit ?: Limit::perHour(100)->by(optional($request->user())->id ?: $request->ip());
        });
        //Limit for Incident Creation
        RateLimiter::for('incident-creation', function (Request $request) {
            $rateLimit = RateLimit::getRateLimit('incident-creation');
            return $rateLimit ?: Limit::perHour(10)->by(optional($request->user())->id ?: $request->ip());
        });
        //Limit for File Upload
        RateLimiter::for('file-upload', function (Request $request) {
            $rateLimit = RateLimit::getRateLimit('file-upload');
            return $rateLimit ?: Limit::perHour(20)->by(optional($request->user())->id ?: $request->ip());
        });
        //Limit for CSV Import
        RateLimiter::for('csv-import', function (Request $request) {
            $rateLimit = RateLimit::getRateLimit('csv-import');
            return $rateLimit ?: Limit::perDay(5)->by(optional($request->user())->id ?: $request->ip());
        });
    }
    
}