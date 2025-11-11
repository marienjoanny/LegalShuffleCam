#!/bin/bash
set -e

BASE_DIR="$(pwd)"
PHP_FILE="$BASE_DIR/public/index.php"
LOG_FILE="$BASE_DIR/logs/fail.log"
REAL_LOG="$BASE_DIR/logs/real-access.log"
TEST_URL="https://legalshufflecam.ovh/?src=linkback"
COOKIE_JAR="$(mktemp)"

echo "== Vérification fichier =="
if [ -f "$PHP_FILE" ]; then
  echo "Fichier trouvé: $PHP_FILE"
  ls -l "$PHP_FILE"
  echo
  echo "---- Début du fichier (100 lignes) ----"
  sed -n '1,100p' "$PHP_FILE" || true
  echo "---- Fin extrait ----"
else
  echo "Fichier $PHP_FILE INEXISTANT"
fi

echo
echo "== Recherche des marqueurs dans le fichier =="
if [ -f "$PHP_FILE" ]; then
  grep -n "src=linkback" "$PHP_FILE" || echo "  -> 'src=linkback' non trouvé"
  grep -n "log_index" "$PHP_FILE" || echo "  -> 'log_index' non trouvé"
  grep -n "age_verified" "$PHP_FILE" || echo "  -> 'age_verified' non trouvé"
fi

echo
echo "== Vérification des logs locaux =="
if [ -f "$LOG_FILE" ]; then
  echo "Log index: $LOG_FILE"
  tail -n 30 "$LOG_FILE"
else
  echo "Log index introuvable: $LOG_FILE"
fi

if [ -f "$REAL_LOG" ]; then
  echo
  echo "Log index-real: $REAL_LOG"
  tail -n 30 "$REAL_LOG"
else
  echo "Log index-real introuvable: $REAL_LOG"
fi

echo
echo "== Test HTTP simulant retour Go.cam (GET ?src=linkback) =="
echo "(headers will be shown; we store cookies in a temporary jar: $COOKIE_JAR)"
curl -s -D - -c "$COOKIE_JAR" "$TEST_URL" -o /dev/null | sed -n '1,120p'

echo
echo "== Contenu du cookie jar =="
if [ -s "$COOKIE_JAR" ]; then
  cat "$COOKIE_JAR"
else
  echo "(cookie jar vide)"
fi

echo
echo "== Fin des vérifs =="
