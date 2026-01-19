#!/bin/bash
# Utilisation: sudo ./ban_processor.sh
# Ce script DOIT être exécuté par CRON toutes les minutes avec SUDO.

# --- Configuration et chemins (Relatif à l'exécution dans /scripts) ---
LOG_FILE="../logs/ban_processor.log"
BANNED_IP_LIST="../data/banned_ips.txt"
AUDIT_LOG="../logs/ban_audit.log"
REPORT_DIR_INCOMING="../logs/reports/pending_review"
REPORT_DIR_STAGING="../logs/reports/banned_but_pending_review"
IP_REGEX="^([0-9]{1,3}\.){3}[0-9]{1,3}$"
IPTABLES_CHAIN="LEGALSHUFFLECAM_BAN"

# --- Fonctions de Log ---
log_action() {
    local TYPE="$1"
    local MESSAGE="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [$TYPE] - $MESSAGE" | tee -a "$LOG_FILE"
}

# --- Initialisation des Prérequis ---
if [ "$(id -u)" -ne 0 ]; then
    log_action "ERREUR" "Doit être exécuté avec 'sudo' ou par 'root' (via CRON)."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_action "ERREUR" "L'outil 'jq' est manquant. Veuillez l'installer (sudo apt install jq)."
    exit 1
fi

mkdir -p "$REPORT_DIR_INCOMING" "$REPORT_DIR_STAGING" 2>/dev/null
touch "$BANNED_IP_LIST" "$AUDIT_LOG"

# Initialisation de la chaîne IPTables
init_iptables_chain() {
    if ! iptables -nL | grep -q "$IPTABLES_CHAIN"; then
        log_action "INFO" "Création de la chaîne IPTables $IPTABLES_CHAIN."
        iptables -N "$IPTABLES_CHAIN"
        if ! iptables -C INPUT -j "$IPTABLES_CHAIN" 2>/dev/null; then
            iptables -I INPUT 1 -j "$IPTABLES_CHAIN"
            log_action "INFO" "Chaîne $IPTABLES_CHAIN insérée dans la chaîne INPUT."
        fi
    fi
}
init_iptables_chain

# --- Main Logic ---
log_action "INFO" "Démarrage du traitement de BAN immédiat dans $REPORT_DIR_INCOMING"

find "$REPORT_DIR_INCOMING" -maxdepth 1 -type f -name "*.json" | while IFS= read -r REPORT_PATH; do
    REPORT_FILE_NAME=$(basename "$REPORT_PATH")
    IP_TO_BAN=$(jq -r '.reportedIP' "$REPORT_PATH" 2>/dev/null)

    if [ -z "$IP_TO_BAN" ] || [ "$IP_TO_BAN" == "null" ] || ! [[ "$IP_TO_BAN" =~ $IP_REGEX ]]; then
        log_action "ERREUR" "IP invalide ou manquante ('$IP_TO_BAN') dans $REPORT_FILE_NAME. Fichier supprimé."
        rm -f "$REPORT_PATH"
        continue
    fi

    log_action "TENTATIVE" "Traitement du rapport $REPORT_FILE_NAME (IP: $IP_TO_BAN) pour BAN."

    if ! iptables -C "$IPTABLES_CHAIN" -s "$IP_TO_BAN" -j DROP 2>/dev/null; then
        iptables -A "$IPTABLES_CHAIN" -s "$IP_TO_BAN" -j DROP
        
        if ! grep -q "^$IP_TO_BAN$" "$BANNED_IP_LIST" 2>/dev/null; then
            echo "$IP_TO_BAN" >> "$BANNED_IP_LIST"
        fi
        
        if command -v netfilter-persistent &> /dev/null; then
            netfilter-persistent save
        fi
        log_action "SUCCES" "Bannissement APPLIQUÉ à l'IP $IP_TO_BAN."
    else
        log_action "AVERTISSEMENT" "IP $IP_TO_BAN déjà bannie. Poursuite du déplacement."
    fi

    mv "$REPORT_PATH" "$REPORT_DIR_STAGING/$REPORT_FILE_NAME"
    log_action "INFO" "Rapport déplacé vers l'examen secondaire: $REPORT_DIR_STAGING."
done

log_action "INFO" "Fin du traitement."
exit 0
