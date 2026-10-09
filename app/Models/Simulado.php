<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Simulado extends Model
{
    protected $fillable = [
        'data_realizacao',
        'concurso_id',
    ];

    public function concurso()
    {
        return $this->belongsTo(Concurso::class, 'concurso_id');
    }

    public function questao()
    {
        return $this->hasMany(SimuladoQuestao::class, 'simulado_id');
    }

}
