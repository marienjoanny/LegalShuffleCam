#!/bin/bash
echo "🛠️ Patch de callback.php pour ajouter un log de debug avant vérification SDK"

TARGET="/var/www/legalshufflecam/public/avs/callback.php"
BACKUP="${TARGET}.pre-debug-patch.bak"

if [ ! -f "$TARGET" ]; then
  echo "❌ Fichier callback.php introuvable"
  exit 1
fi

cp "$TARGET" "$BACKUP"
echo "📦 Backup enregistré : $BACKUP"

# Injecte un log juste avant fromPayload()
sed -i '/\/\/ 4. Vérifie la signature/i\
    logLine($logFail, "DEBUG | Payload brut: " . json_encode($payload));\
    $valid = $avs->fromPayload($payload);\
    logLine($logFail, "DEBUG | Résultat SDK: " . ($valid ? "valide" : "invalide"));\
    if (!$valid) {' "$TARGET"

echo "✅ Patch de debug injecté dans callback.php"
