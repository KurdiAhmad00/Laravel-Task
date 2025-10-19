<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'incident_id',
        'actor_id',
        'action',
        'old_values',
        'new_values',
    ];
    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }
    public function actor()
    {
        return $this->belongsTo(User::class);
    }
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
    public function scopeByActor($query, $userId)
    {
        return $query->where('actor_id', $userId);
    }
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }
    public function scopeForIncident($query, $incidentId)
    {
        return $query->where('incident_id', $incidentId);
    }
}
