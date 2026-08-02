# Render deployment image (Prompt 55 Part C). Render has no native PHP
# runtime (only Node/Bun, Python, Ruby, Go, Rust, Elixir) — PHP apps are
# deployed via Docker there, which is what this file is for. Built and
# run as a single container: nginx (front door, serves public/ and
# proxies *.php to php-fpm) + php-fpm, both supervised so the container
# has one PID 1 that manages both processes.
FROM php:8.4-fpm-alpine

# Runtime shared libs stay installed permanently; the matching -dev
# headers/build tools are a virtual group removed after the extensions
# below are compiled. Kept as two separate `apk add` calls deliberately
# (not one list split into a virtual group with `apk del` at the end) —
# an earlier version of this Dockerfile put libpng/libpq/icu-libs/etc.
# only inside the -dev group, so `apk del` cascaded and removed those
# runtime .so files too, breaking every extension that linked against
# them (caught by actually building this image, not just reading the
# Dockerfile).
RUN apk add --no-cache \
        nginx \
        supervisor \
        gettext \
        libpng \
        libzip \
        libpq \
        icu-libs \
        oniguruma \
        freetype \
        libjpeg-turbo \
    && apk add --no-cache --virtual .build-deps \
        libpng-dev \
        libzip-dev \
        libxml2-dev \
        postgresql-dev \
        icu-dev \
        oniguruma-dev \
        freetype-dev \
        libjpeg-turbo-dev \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_pgsql \
        pgsql \
        gd \
        zip \
        bcmath \
        intl \
        opcache \
    && apk del .build-deps

WORKDIR /var/www/html

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Dependencies installed from the lock file before the rest of the app
# is copied in, so an unrelated code change doesn't bust this layer's
# Docker build cache.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && php artisan storage:link \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/nginx.conf.template /etc/nginx/http.d/default.conf.template
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
# Base image's default php-fpm pool (www.conf) already listens on
# 127.0.0.1:9000 — left as-is; nginx's fastcgi_pass targets that same
# address/port.
RUN chmod +x /entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
