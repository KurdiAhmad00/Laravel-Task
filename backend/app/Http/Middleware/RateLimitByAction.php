<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class RateLimitByAction
{
    public function handle($request, Closure $next, $action, $maxAttempts, $decayMinutes)
    {
        $key = $this->resolveRequestSignature($request, $action);
        
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            return response()->json([
                'message' => 'Too many attempts. Please try again later.',
                'retry_after' => RateLimiter::availableIn($key),
                'action' => $action,
                'max_attempts' => $maxAttempts
            ], 429);
        }
        
        RateLimiter::hit($key, $decayMinutes * 60);
        return $next($request);
    }

    /**
     * Resolve the request signature for rate limiting
     */
    protected function resolveRequestSignature($request, $action)
    {
        $user = $request->user();
        $ip = $request->ip();
        
        // Create unique key based on user ID (if authenticated) or IP address
        $identifier = $user ? $user->id : $ip;
        
        return "rate_limit:{$action}:{$identifier}";
    }
}