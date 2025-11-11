#!/bin/bash
set -e

echo "🔍 === Diagnostic AVS / PHP / Nginx ==="
echo "Dossier courant : $(pwd)"
echo

# 1️⃣ Vérifier où se trouve le fichier index.php
echo "== Vérification des fichiers index.php =="
for path in /var/www/legalshufflecam/index.php /var/www/legalshufflecam/public/index.php; do
  if [[ -f "$path" ]]; then
    echo "✅ Fichier trouvé : $path"
    head -n 5 "$path" | sed 's/^/   /'
  else
    echo "⚠️  Fichier manquant : $path"
  fi
done
echo

# 2️⃣ Recherche des marqueurs du patch
echo "== Recherche des marqueurs de patch dans index.php =="
grep -nE 'src=linkback|age_verified|log_index' /var/www/legalshufflecam/**/*.php 2>/dev/null || echo "⚠️  Aucun marqueur trouvé"
echo

# 3️⃣ Vérification de la configuration Nginx pour ce domaine
NGINX_CONF=$(grep -Rl "legalshufflecam" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | head -n 1)
if [[ -n "$NGINX_CONF" ]]; then
  echo "== Configuration Nginx détectée : $NGINX_CONF =="
  grep -E "server_name|root|location ~ \.php|fastcgi_pass" -A2 "$NGINX_CONF" | sed 's/^/   /'
else
  echo "⚠️  Aucun fichier de conf Nginx trouvé pour legalshufflecam"
fi
echo

# 4️⃣ Test d'exécution locale de PHP via curl
echo "== Test de requête locale (127.0.0.1) =="
CURL_OUT=$(mktemp)
COOKIE_JAR=$(mktemp)
curl -sv -o "$CURL_OUT" -D - "http://127.0.0.1/index.php?src=linkback" --cookie-jar "$COOKIE_JAR" || true

echo
echo "== En-têtes HTTP retournés =="
grep -E 'HTTP/|Set-Cookie|Location' "$CURL_OUT" || cat "$CURL_OUT"

echo
echo "== Contenu du cookie jar =="
cat "$COOKIE_JAR" || echo "⚠️ Aucun cookie enregistré"
echo

# 5️⃣ Vérification des logs
echo "== Vérification des logs =="
LOG_DIR="/var/www/legalshufflecam/logs"
if [[ -d "$LOG_DIR" ]]; then
  for f in "$LOG_DIR"/*.log; do
    echo "-- $f --"
    tail -n 5 "$f" 2>/dev/null || echo "(vide)"
  done
else
  echo "⚠️  Aucun dossier logs trouvé à $LOG_DIR"
fi
echo

# 6️⃣ Logs nginx (dernier 10 min)
echo "== Derniers logs Nginx (10 dernières lignes) =="
if [[ -f /var/log/nginx/access.log ]]; then
  echo "-- access.log --"
  tail -n 10 /var/log/nginx/access.log
fi
if [[ -f /var/log/nginx/error.log ]]; then
  echo "-- error.log --"
  tail -n 10 /var/log/nginx/error.log
fi

echo
echo "✅ Fin du diagnostic. Si aucun Set-Cookie ou Location n'apparaît → PHP non exécuté ou mauvais fichier servi."
