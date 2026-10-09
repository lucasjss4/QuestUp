<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alternativa extends Model
{
    protected $fillable = [
        'texto',
        'correta',
        'opcao',
        'questao_id',
    ];

    public function questao()
    {
        return $this->belongsTo(Questao::class, 'questao_id');
    }
}
