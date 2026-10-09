<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Materia extends Model
{
    protected $fillable = [
        'Nome',
        'Descricao',
    ];

    public function conteudo()
    {
        return $this->hasMany(Conteudo::class, 'materia_id');
    }
}