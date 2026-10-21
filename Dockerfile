# Usar a imagem oficial do PHP com Apache
FROM php:8.3-apache

# 1. Instalar dependências do sistema e Node.js (para compilar o front-end)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    nodejs \
    npm

# Limpar cache do apt
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Adicione pdo_pgsql e pgsql na instalação de extensões do PHP:
RUN docker-php-ext-install pdo_pgsql pgsql pdo_mysql mbstring exif pcntl bcmath gd

# 3. Obter o Composer mais recente
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 4. Configurar o Apache para apontar para a pasta /public do Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Habilitar o mod_rewrite do Apache (necessário para as rotas do Laravel)
RUN a2enmod rewrite

# 5. Definir o diretório de trabalho
WORKDIR /var/www/html

# 6. Copiar todos os arquivos do projeto para o container
COPY . .

# 7. Instalar dependências do Composer (ignorando pacotes de dev)
RUN composer install --no-dev --optimize-autoloader

# 8. Instalar dependências do Node e compilar os assets (Vite/Mix)
RUN npm install && npm run build

# 9. Ajustar permissões das pastas de cache e storage para o Apache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80
ENTRYPOINT ["entrypoint.sh"]