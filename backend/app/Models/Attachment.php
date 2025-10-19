<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Attachment extends Model
{
    protected $fillable = [
        'incident_id',
        'filename',
        'content_type',
        'size_bytes',
        'storage_key',
    ];
    
    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }
    public function getUrlAttribute()
    {
        return Storage::url($this->storage_key);
    }
}
