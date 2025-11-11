#!/bin/bash

CONF="/etc/turnserver.conf"
echo "🔍 Diagnostic complet coturn TLS"

echo ""
echo "🧪 1. Vérification compilation avec OpenSSL :"
turnserver -V | grep -i openssl && echo "✅ Coturn compilé avec OpenSSL" || echo "❌ OpenSSL absent — recompiler avec --with-ssl"

echo ""
echo "🔥 2. Vérification pare-feu :"
ufw status | grep 5349 && echo "✅ Port 5349 autorisé dans le pare-feu" || {
  echo "❌ Port 5349 bloqué — ajout de la règle..."
  ufw allow 5349/tcp && echo "✅ Règle ajoutée"
}

echo ""
echo "📡 3. Vérification écoute réseau sur 5349 :"
ss -tulnp | grep 5349 && echo "✅ Port 5349 ouvert" || echo "❌ Port 5349 non ouvert"

echo ""
echo "🧼 4. Vérification des doublons IP/port dans $CONF :"
echo "→ Lignes dupliquées :"
awk '{count[$0]++} END {for (line in count) if (count[line]>1) print count[line] "× " line}' "$CONF"

echo ""
echo "🔍 5. Test TLS local sur 5349 :"
openssl s_client -connect 127.0.0.1:5349 < /dev/null || echo "❌ Échec TLS 5349"

echo ""
echo "📜 Logs coturn en direct (Ctrl+C pour quitter)"
journalctl -u coturn.service -f
