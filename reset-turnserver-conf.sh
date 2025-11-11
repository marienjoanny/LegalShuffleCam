#!/bin/bash

CONF="/etc/turnserver.conf"
DOMAIN="legalshufflecam.ovh"
CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
PKEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
PUBLIC_IP=$(hostname -I | awk '{print $1}')

echo "🔥 Suppression de l'ancien fichier $CONF..."
rm -f "$CONF"

echo "🧾 Création d'un nouveau fichier $CONF..."

cat <<EOCONF > "$CONF"
listening-port=3478
tls-listening-port=5349

listening-ip=127.0.0.1
listening-ip=$PUBLIC_IP
tls-listening-ip=127.0.0.1
tls-listening-ip=$PUBLIC_IP
relay-ip=$PUBLIC_IP

cert=$CERT
pkey=$PKEY

fingerprint
lt-cred-mech
realm=$DOMAIN
user=user:6945ea1ef73a87ff45116ae305ae019c36945d4d455a0f5bf44f24ad9efdb82c

no-tlsv1
no-tlsv1_1
cipher-list="ECDHE-RSA-AES256-GCM-SHA384"

verbose
log-file=/var/log/turnserver.log
EOCONF

echo "✅ Nouveau fichier $CONF créé"

echo "🔄 Redémarrage de coturn..."
systemctl restart coturn && echo "✅ coturn redémarré" || echo "❌ Échec redémarrage"

echo "📡 Vérification écoute réseau..."
ss -tulnp | grep 3478 || echo "❌ Port 3478 non ouvert"
ss -tulnp | grep 5349 || echo "❌ Port 5349 non ouvert"

echo "🔍 Test TLS local sur 5349..."
openssl s_client -connect 127.0.0.1:5349 < /dev/null || echo "❌ Échec TLS 5349"

echo "📜 Logs coturn en direct (Ctrl+C pour quitter)"
journalctl -u coturn.service -f
