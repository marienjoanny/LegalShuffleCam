#!/bin/bash

DOMAIN="legalshufflecam.ovh"
CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
ROOT="/var/www/legalshufflecam/public"
TURN_PORT="5349"
USERNAME="gandalfshuffle@webRTC"
CREDENTIAL="d6e1ef7a83f7f116ea305ae0191c36945d44d5f0"

echo "🔁 Redémarrage des services..."
sudo systemctl restart coturn-custom.service
sudo systemctl restart legalshufflecam.service
sleep 2

echo -e "\n📡 Vérification écoute Coturn sur le port TLS $TURN_PORT..."
ss -tulnp | grep $TURN_PORT && echo "✅ Coturn écoute sur $TURN_PORT" || echo "❌ Coturn n’écoute pas sur $TURN_PORT"

echo -e "\n🔐 Test TLS avec openssl sur $DOMAIN..."
openssl s_client -connect $DOMAIN:$TURN_PORT < /dev/null | grep -q "BEGIN CERTIFICATE" && echo "✅ TLS OK" || echo "❌ Échec TLS"

echo -e "\n📄 Vérification du certificat..."
openssl x509 -in "$CERT" -text -noout | grep -E 'Subject:|DNS:' || echo "❌ Impossible de lire le certificat"
openssl x509 -in "$CERT" -noout -enddate || echo "❌ Impossible de lire la date d’expiration"

echo -e "\n🧠 Vérification des fichiers JS dans $ROOT et $ROOT/js..."
find "$ROOT" "$ROOT/js" -type f -name "*.js" | while read -r file; do
  echo -e "\n📁 Fichier : $file"
  grep -q "turns:$DOMAIN:$TURN_PORT" "$file" && echo "✅ TURN URL présent" || echo "❌ TURN URL absent"
  grep -q "$USERNAME" "$file" && echo "✅ username présent" || echo "❌ username absent"
  grep -q "$CREDENTIAL" "$file" && echo "✅ credential présent" || echo "❌ credential absent"
done

echo -e "\n🎉 Vérification complète terminée. Tu peux tester WebRTC sur https://$DOMAIN"
