<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncidentNote extends Model
{
    protected $fillable = [
        'incident_id',
        'user_id',
        'body',
    ];

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
    public function scopeOldest($query)
    {
        return $query->orderBy('created_at', 'asc');
    }
    public function scopeRecent($query, $days = 7)
    {
    return $query->where('created_at', '>=', now()->subDays($days));
    }
}
