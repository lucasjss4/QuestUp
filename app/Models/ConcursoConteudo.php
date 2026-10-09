<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConcursoConteudo extends Model
{
    protected $fillable = [
        'concurso_id',
        'conteudo_id',
    ];

    public function concurso()
    {
        return $this->belongsTo(Concurso::class, 'concurso_id');
    }

    public function conteudo()
    {
        return $this->belongsTo(Conteudo::class, 'conteudo_id');
    }
}
