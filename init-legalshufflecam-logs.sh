#!/bin/bash
echo "📁 Initialisation du dossier de logs /var/log/legalshufflecam"

LOGDIR="/var/log/legalshufflecam"
SUCCESS="$LOGDIR/success.log"
FAIL="$LOGDIR/fail.log"

mkdir -p "$LOGDIR"
touch "$SUCCESS" "$FAIL"
chown -R www-data:www-data "$LOGDIR"
chmod 664 "$SUCCESS" "$FAIL"

echo "✅ Dossier et fichiers de log prêts"
