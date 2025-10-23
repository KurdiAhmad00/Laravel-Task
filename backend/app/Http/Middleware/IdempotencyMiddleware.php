<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Idempotency;
use Illuminate\Support\Str;

class IdempotencyMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply to POST, PUT, PATCH requests
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH'])) {
            return $next($request);
        }

        // Get idempotency key from header or request body
        $idempotencyKey = $request->header('Idempotency-Key') ?? 
                         $request->input('idempotency_key') ?? 
                         $this->generateKey($request);

        if (Idempotency::isValid($idempotencyKey)) {
            $cachedResponse = Idempotency::getCachedResponse($idempotencyKey);
            if ($cachedResponse) {
                return response()->json($cachedResponse['data'], $cachedResponse['status']);
            }
        }

        // Process the request
        $response = $next($request);

        if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            $responseData = [
                'data' => json_decode($response->getContent(), true),
                'status' => $response->getStatusCode()
            ];
            
            Idempotency::storeResponse($idempotencyKey, $responseData, 60); // 1 hour expiration
        }

        return $response;
    }

    /**
     * Generate a unique key based on request data
     */
    private function generateKey(Request $request): string
    {
        $data = [
            'method' => $request->method(),
            'url' => $request->url(),
            'body' => $request->all(),
            'user_id' => $request->user()?->id ?? 'guest',
            'ip' => $request->ip()
        ];

        return 'auto_' . hash('sha256', json_encode($data));
    }
}
