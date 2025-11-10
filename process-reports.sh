#!/bin/bash

REPORT_DIR="/var/www/legalshufflecam/public/api/logs/reports"
ARCHIVE_DIR="/var/www/legalshufflecam/public/api/logs/archived"
BLACKLIST="/etc/fail2ban/ip.blacklist"
JAIL="nginx-suspicious"

mkdir -p "$ARCHIVE_DIR"
shopt -s nullglob

FILES=("$REPORT_DIR"/report-*.json)

if [ ${#FILES[@]} -eq 0 ]; then
  echo "📭 Aucun signalement à traiter."
  exit 0
fi

for file in "${FILES[@]}"; do
    echo "📄 Traitement du signalement : $file"
    reporter=$(jq -r .reporterId "$file")
    reported=$(jq -r .reportedId "$file")
    ip=$(jq -r .ip "$file")
    reason=$(jq -r .reason "$file")
    session=$(jq -r .sessionId "$file")
    timestamp=$(jq -r .timestamp "$file")
    echo "🕒 Date : $timestamp"
    echo "👤 Reporter : $reporter"
    echo "🚫 Signalé : $reported"
    echo "🌐 IP : $ip"
    echo "📣 Motif : $reason"
    echo "🔗 Session : $session"
    echo "----------------------------------------"
    echo "Action ? [v]alider / [a]rchiver / [s]auter / [m]ail / [b]annir"
    read -n1 action
    echo ""

    case "$action" in
        v)
            echo "✅ Validé. Archivé."
            mv "$file" "$ARCHIVE_DIR/"
            ;;
        a)
            echo "📦 Archivé sans action."
            mv "$file" "$ARCHIVE_DIR/"
            ;;
        s)
            echo "⏭ Sauté."
            ;;
        m)
            echo ""
            echo "📧 Email à transmettre aux autorités :"
            echo "----------------------------------------"
            echo "À : cybercrime@gendarmerie.interieur.gouv.fr"
            echo "Objet : Signalement utilisateur suspect - $reported"
            echo ""
            echo "Bonjour,"
            echo "Je vous transmets un signalement reçu via notre plateforme LegalShuffleCam :"
            echo ""
            echo "🕒 Date : $timestamp"
            echo "👤 Reporter : $reporter"
            echo "🚫 Signalé : $reported"
            echo "🌐 Adresse IP : $ip"
            echo "📣 Motif : $reason"
            echo "🔗 Session : $session"
            echo ""
            echo "Le fichier JSON est disponible ici : $file"
            echo ""
            echo "Cordialement,"
            echo "Marien — administrateur LegalShuffleCam"
            echo "----------------------------------------"
            mv "$file" "$ARCHIVE_DIR/"
            ;;
        b)
            echo "🔒 IP $ip bannie via Fail2ban..."
            fail2ban-client set "$JAIL" banip "$ip"
            echo "$ip # Banni le $(date)" >> "$BLACKLIST"
            mv "$file" "$ARCHIVE_DIR/"
            ;;
        *)
            echo "❓ Action inconnue. Sauté."
            ;;
    esac
    echo ""
done

echo "✅ Tous les signalements ont été traités."
