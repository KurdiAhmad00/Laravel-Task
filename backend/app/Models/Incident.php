<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Incident extends Model
{
    protected $fillable = [
        'title',
        'description',
        'category_id',
        'priority',
        'status',
        'location_lat',
        'location_lng',
        'citizen_id',
        'assigned_agent_id',
        'operator_notes',
        'resolved_at',
    ];

    protected $casts = [
        'location_lat' => 'decimal:8',
        'location_lng' => 'decimal:8',
        'resolved_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function citizen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'citizen_id');
    }

    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(IncidentNote::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }
    
    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['New', 'Assigned', 'In Progress']);
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'Resolved');
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
