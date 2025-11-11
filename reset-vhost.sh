#!/bin/bash

echo "🧹 Suppression de l'ancien vhost..."
rm -f /etc/nginx/sites-enabled/legalshufflecam.ovh
rm -f /etc/nginx/sites-available/legalshufflecam.ovh

echo "🛠 Création du nouveau vhost avec support PHP dans /api/..."

cat << 'NGINX' > /etc/nginx/sites-available/legalshufflecam.ovh
server {
    listen 443 ssl;
    server_name legalshufflecam.ovh www.legalshufflecam.ovh;

    root /var/www/legalshufflecam/public;
    index index.php;

    location ^~ /api/ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    location ~ ^/cgi-bin/ {
        deny all;
        return 403;
    }

    location ~ /\.(git|env|htaccess|DS_Store) { deny all; access_log off; log_not_found off; }
    location ~ ^/(vendor|storage)/          { deny all; }
    location = /config.php                  { deny all; }
    location = /composer.lock               { deny all; }
    location = /composer.json               { deny all; }
    location ~ ^/admin/                     { deny all; }
    location ~ ^/logs/                      { deny all; }

    location ~ \.(css|js|jpe?g|png|gif|ico|eot|svg|ttf|woff|woff2)$ {
        expires 30d;
        try_files $uri =404;
    }

    location /socket.io/ {
        proxy_pass https://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    ssl_certificate /etc/letsencrypt/live/legalshufflecam.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/legalshufflecam.ovh/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name legalshufflecam.ovh www.legalshufflecam.ovh;
    return 301 https://$host$request_uri;
}
NGINX

echo "🔗 Activation du vhost..."
ln -s /etc/nginx/sites-available/legalshufflecam.ovh /etc/nginx/sites-enabled/legalshufflecam.ovh

echo "🔄 Test et rechargement de Nginx..."
nginx -t && systemctl reload nginx

echo "✅ Vhost mis à jour et rechargé avec succès."
