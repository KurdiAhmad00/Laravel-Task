<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\AdminController;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('categories', [IncidentController::class, 'getCategories']);
    Route::get('/incidents/{incident}', [IncidentController::class, 'show']);
    Route::get('/attachments/{attachment}/download', [IncidentController::class, 'downloadAttachment']);
    // Citizen routes
    Route::middleware('role:citizen')->group(function () {
        Route::get('/my-incidents', [IncidentController::class, 'myIncidents']);
        Route::post('/incidents', [IncidentController::class, 'store']);
        Route::put('/incidents/{incident}', [IncidentController::class, 'update']);
        Route::delete('/incidents/{incident}', [IncidentController::class, 'destroy']);
        Route::delete('/my-incidents', [IncidentController::class, 'deleteAll']); 
        
        // File attachments
        Route::post('/incidents/{incident}/attachments', [IncidentController::class, 'uploadAttachment']);
        Route::get('/incidents/{incident}/attachments', [IncidentController::class, 'getAttachments']);
        Route::delete('/attachments/{attachment}', [IncidentController::class, 'DeleteAttachment']);
    });
    
    // Operator routes
    Route::middleware('role:operator,admin')->group(function () {
        Route::get('/incidents', [IncidentController::class, 'index']);
        Route::post('/incidents/{incident}/assign', [IncidentController::class, 'assign']);
        Route::post('/incidents/{incident}/priority', [IncidentController::class, 'updatePriority']);
        
        // Get agents for assignment
        Route::get('/agents', [AdminController::class, 'getAgents']);
        
        // Audit logs for operators
        Route::get('/audit-logs', [AdminController::class, 'getAuditLogs']);
        Route::get('/audit-logs/{incident}', [AdminController::class, 'getIncidentAuditLogs']);
    });
    
    // Agent routes 
    Route::middleware('role:agent,admin')->group(function () {
        Route::get('/assigned-incidents', [IncidentController::class, 'assignedIncidents']);
        Route::post('/incidents/{incident}/status', [IncidentController::class, 'updateStatus']);
        Route::post('/incidents/{incident}/notes', [IncidentController::class, 'addNote']);
    });
    
    // Admin routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/incidents', [IncidentController::class, 'index']); 
        Route::get('/users', [AdminController::class, 'index']);
        Route::put('/users/{user}/role', [AdminController::class, 'updateRole']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::delete('/users/{user}/cascade', [AdminController::class, 'deleteUserWithCascade']);
        // Category management
        Route::post('/categories', [AdminController::class, 'createCategory']);
        Route::put('/categories/{category}', [AdminController::class, 'updateCategory']);
        Route::delete('/categories/{category}', [AdminController::class, 'deleteCategory']);

    });
});
