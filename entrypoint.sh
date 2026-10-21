#!/bin/sh
# Executa as migrations no banco do Render
php artisan migrate --force

# Inicia o servidor Apache
exec apache2-foreground