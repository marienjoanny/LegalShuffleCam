#!/bin/bash

CONF="/etc/nginx/sites-available/legalshufflecam.ovh"
ENABLED="/etc/nginx/sites-enabled/legalshufflecam.ovh"

echo "🧨 Suppression de la conf Nginx existante..."
rm -f "$CONF" "$ENABLED"

echo "🧱 Injection de la nouvelle conf Nginx..."
cat <<'NGINX' > "$CONF"
server {
    listen 443 ssl;
    server_name legalshufflecam.ovh www.legalshufflecam.ovh;

    ssl_certificate /etc/letsencrypt/live/legalshufflecam.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/legalshufflecam.ovh/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location = /.env              { deny all; }
    location = /config.php        { deny all; }
    location = /composer.lock     { deny all; }
    location = /composer.json     { deny all; }
    location ~ ^/admin/           { deny all; }
    location ~ ^/logs/            { deny all; }
    location ~ /\.git             { deny all; }
    location ~ /\.ht              { deny all; }
    location ~ /\.DS_Store        { deny all; }

    location ~ \.(css|js|jpe?g|png|gif|ico|eot|svg|ttf|woff|woff2)$ {
        expires 30d;
        try_files $uri =404;
    }

    location /socket.io/ {
        proxy_pass https://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
}

server {
    listen 80;
    server_name legalshufflecam.ovh www.legalshufflecam.ovh;
    return 301 https://$host$request_uri;
}
NGINX

echo "🔗 Réactivation du lien symbolique..."
ln -s "$CONF" "$ENABLED"

echo "🔁 Test et reload de Nginx..."
nginx -t && systemctl reload nginx && echo "✅ Nginx rechargé avec succès."
