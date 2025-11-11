#!/bin/bash

ROOT="/var/www/legalshufflecam/public"
TURN_DOMAIN="legalshufflecam.ovh"
TURN_PORT="5349"
USERNAME="gandalfshuffle@webRTC"
CREDENTIAL="d6e1ef7a83f7f116ea305ae0191c36945d44d5f0"

echo "🛠️ Injection de la config TURN dans les fichiers JS..."

find "$ROOT" "$ROOT/js" -type f -name "*.js" | while read -r file; do
  if grep -q "username" "$file" && grep -q "credential" "$file" && ! grep -q "turns:$TURN_DOMAIN:$TURN_PORT" "$file"; then
    echo "🔧 Mise à jour : $file"

    sed -i "/RTCPeerConnection\s*({/a \ \ \ \ iceServers: [\n    {\n      urls: \"turns:$TURN_DOMAIN:$TURN_PORT\",\n      username: \"$USERNAME\",\n      credential: \"$CREDENTIAL\"\n    },\n    {\n      urls: \"stun:stun.l.google.com:19302\"\n    }\n  ]," "$file"
  fi
done

echo "✅ Injection terminée."
