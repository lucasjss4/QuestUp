<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimuladoQuestao extends Model
{
    protected $fillable = [
        'opcao_marcada',
        'acerto',
        'questao_id',
        'simulado_id',
    ];

    public function questao()
    {
        return $this->belongsTo(Questao::class, 'questao_id');
    }
    
    public function simulado()
    {
        return $this->belongsTo(Simulado::class, 'simulado_id');
    }

}
