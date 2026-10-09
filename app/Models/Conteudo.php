<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conteudo extends Model
{
    protected $fillable = [
        'Nome',
        'Descricao',
        'materia_id',
    ];

    public function materia()
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }    
    
    public function concursoConteudo()
    {
        return $this->hasMany(ConcursoConteudo::class, 'conteudo_id');
    }

    public function questao()
    {
        return $this->hasMany(Questao::class, 'conteudo_id');
    }
}
