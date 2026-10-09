<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Questao extends Model
{
    protected $fillable = [
        'Enunciado',
        'origem',
        'Dificuldade',
        'conteudo_id',
    ];

    public function conteudo()
    {
        return $this->belongsTo(Conteudo::class, 'conteudo_id');
    }

    public function alternativa()
    {
        return $this->hasMany(Alternativa::class, 'questao_id');
    }
}
