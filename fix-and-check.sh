#!/bin/bash
set -e
echo "=== fix-and-check.sh — réparation permissions + vérifs AVS ==="
echo "Lancer en root (sudo) si nécessaire."

# Variables
APP_ROOT="/var/www/legalshufflecam"
LOG_DIR_APP="$APP_ROOT/logs"
SYS_LOG_DIR="/var/log"
APP_LOG_PREFIX="legalshufflecam"
SYS_APP_LOG_DIR="$SYS_LOG_DIR/$APP_LOG_PREFIX"
NGINX_ACCESS="/var/log/nginx/access.log"
NGINX_ERROR="/var/log/nginx/error.log"

# 1) Créer / réparer le dossier système de log si nécessaire
if [ ! -d "$SYS_APP_LOG_DIR" ]; then
  echo "=> Création du dossier système de logs: $SYS_APP_LOG_DIR"
  mkdir -p "$SYS_APP_LOG_DIR"
  chown www-data:www-data "$SYS_APP_LOG_DIR" || true
  chmod 750 "$SYS_APP_LOG_DIR" || true
fi

# 2) S'assurer que les logs applicatifs existent et sont accessibles par PHP-FPM (www-data)
for f in "$SYS_APP_LOG_DIR"/denied.log "$SYS_APP_LOG_DIR"/fail.log "$SYS_APP_LOG_DIR"/success.log; do
  if [ ! -f "$f" ]; then
    echo "=> Création $f"
    touch "$f"
  fi
  chown www-data:www-data "$f" || true
  chmod 640 "$f" || true
done

# 3) S'assurer que le dossier logs de l'app est OK
if [ ! -d "$LOG_DIR_APP" ]; then
  echo "=> Création du dossier $LOG_DIR_APP"
  mkdir -p "$LOG_DIR_APP"
fi
chown -R www-data:www-data "$LOG_DIR_APP" || true
chmod -R 750 "$LOG_DIR_APP" || true

echo
echo "=== Perms réglées (www-data:www-data) ==="
ls -ld "$SYS_APP_LOG_DIR" || true
ls -l "$SYS_APP_LOG_DIR" || true
echo

# 4) Afficher la conf Nginx pertinente (server block qui contient legalshufflecam)
echo "=== Recherche conf Nginx pour 'legalshufflecam' ==="
NGXCONF=$(grep -RIl "legalshufflecam" /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null | head -n1 || true)
if [ -n "$NGXCONF" ]; then
  echo "Fichier Nginx trouvé: $NGXCONF"
  echo "---- extrait pertinent ----"
  grep -nE "server_name|root|location|fastcgi_pass" -n "$NGXCONF" || true
  echo "---- fin extrait ----"
else
  echo "Aucun fichier Nginx trouvé référant 'legalshufflecam' dans /etc/nginx/sites-enabled ou conf.d"
fi
echo

# 5) Test curl local simple (sans host override)
echo "=== Test curl local simple (http://127.0.0.1/?src=linkback) ==="
TMP_HEADERS1=$(mktemp)
curl -sv -o /dev/null -D "$TMP_HEADERS1" "http://127.0.0.1/?src=linkback" || true
echo "---- En-têtes (local) ----"
sed -n '1,200p' "$TMP_HEADERS1"
echo

# 6) Test curl simulant Host + X-Forwarded-Proto: https (comme si venant du domaine et proxy)
echo "=== Test curl simulant Host + X-Forwarded-Proto (https) ==="
TMP_HEADERS2=$(mktemp)
curl -sv -o /dev/null -D "$TMP_HEADERS2" -H "Host: legalshufflecam.ovh" -H "X-Forwarded-Proto: https" "http://127.0.0.1/?src=linkback" || true
echo "---- En-têtes (Host + X-Forwarded-Proto) ----"
sed -n '1,200p' "$TMP_HEADERS2"
echo

# 7) Test curl via socket (index.php explicit) pour vérifier exact fichier exécuté
echo "=== Test curl vers /index.php?src=linkback (host override) ==="
TMP_HEADERS3=$(mktemp)
curl -sv -o /dev/null -D "$TMP_HEADERS3" -H "Host: legalshufflecam.ovh" -H "X-Forwarded-Proto: https" "http://127.0.0.1/index.php?src=linkback" || true
echo "---- En-têtes (/index.php explicit) ----"
sed -n '1,200p' "$TMP_HEADERS3"
echo

# 8) Afficher les 30 dernières lignes des logs d'app et nginx pour repérer warnings
echo "=== Dernières lignes logs app ($LOG_DIR_APP) ==="
for lf in "$LOG_DIR_APP"/*.log; do
  if [ -f "$lf" ]; then
    echo "-- $lf --"
    tail -n 30 "$lf" || true
  fi
done
echo

echo "=== Dernières lignes logs système ($SYS_APP_LOG_DIR) ==="
for lf in "$SYS_APP_LOG_DIR"/*.log; do
  if [ -f "$lf" ]; then
    echo "-- $lf --"
    tail -n 30 "$lf" || true
  fi
done
echo

echo "=== Dernières lignes nginx logs ==="
if [ -f "$NGINX_ACCESS" ]; then
  echo "-- access.log --"
  tail -n 20 "$NGINX_ACCESS" || true
fi
if [ -f "$NGINX_ERROR" ]; then
  echo "-- error.log --"
  tail -n 20 "$NGINX_ERROR" || true
fi
echo

# 9) Conseils / next steps (printed)
echo "=== Résumé & next steps ==="
echo "1) Si les en-têtes renvoient désormais 'Set-Cookie' et 'Location', tout est bon."
echo "2) Si pas de Set-Cookie, vérifier :"
echo "   - le fichier index retourné est bien exécuté par PHP (regarder 'Location' ou 'X-Powered-By' en entêtes),"
echo "   - le root dans la conf nginx correspond à /var/www/legalshufflecam/public (ou ajuster)."
echo "3) Si erreurs 'permission denied' persistent, ajuste owner/group et permissions des logs et du dossier de l'app pour que php-fpm (user www-data) puisse écrire."
echo
echo "Fin du script."
