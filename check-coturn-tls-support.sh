#!/bin/bash

echo "🔍 Vérification du support TLS pour coturn"

echo "🧪 1. Version de coturn et support OpenSSL :"
turnserver -V | grep -i openssl && echo "✅ OpenSSL détecté" || echo "❌ OpenSSL absent — recompiler coturn avec --with-ssl"

echo "🔥 2. Vérification pare-feu (ufw) :"
ufw status | grep 5349 && echo "✅ Port 5349 autorisé" || {
  echo "❌ Port 5349 bloqué — ajout règle..."
  ufw allow 5349/tcp && echo "✅ Règle ajoutée"
}

echo "📡 3. Vérification écoute réseau sur 5349 :"
ss -tulnp | grep 5349 && echo "✅ Port 5349 ouvert" || echo "❌ Port 5349 non ouvert"

echo "🔍 4. Test TLS local sur 5349 :"
openssl s_client -connect 127.0.0.1:5349 < /dev/null || echo "❌ Échec TLS 5349"

echo "📜 Logs coturn en direct (Ctrl+C pour quitter)"
journalctl -u coturn.service -f
