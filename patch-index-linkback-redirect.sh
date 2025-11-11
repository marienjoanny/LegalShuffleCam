#!/bin/bash
echo "🔧 Correction de la redirection linkback vers index-real.php"

TARGET="public/index.php"
BACKUP="${TARGET}.pre-linkback-redirect.bak"

cp "$TARGET" "$BACKUP"
echo "🗂️  Backup enregistré : $BACKUP"

# Remplacement dans le fichier
sed -i 's|header("Location: /", true, 302);|header("Location: /index-real.php", true, 302);|' "$TARGET"

echo "✅ Redirection linkback corrigée vers /index-real.php"
