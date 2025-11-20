#!/bin/bash

# ==============================================================================
# SCRIPT DE BAN IMMÉDIAT PAR CRON (ban_processor.sh)
# Rôle: Bannir immédiatement l'IP du signalement et transférer le rapport (JSON + PNG) 
#       en attente de révision manuelle.
# Ce script doit tourner chaque minute via CRON.
# ==============================================================================

# --- Configuration ---
# Répertoire des nouveaux rapports (où le PHP les dépose)
INCOMING_DIR="/var/www/legalshufflecam/logs/reports" 
# Répertoire des rapports dont l'IP est déjà bannie (en attente de votre revue)
PENDING_DIR="/var/www/legalshufflecam/logs/reports/pending_review" 
# Fichier de la liste de simulation des IPs bannies
IP_FILE="/var/www/legalshufflecam/data/banned_ips.txt" 

# --- Fonction de Logging ---
log_action() {
    local TYPE="$1"
    local MESSAGE="$2"
    local TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$TYPE" in
        INFO)    COLOR='\033[0;34m';;
        SUCCES)  COLOR='\033[0;32m';;
        ECHEC)   COLOR='\033[0;31m';;
        AVERTISSEMENT) COLOR='\033[0;33m';;
        *)       COLOR='\033[0m';;
    esac

    echo -e "${COLOR}[$TIMESTAMP] [$TYPE] $MESSAGE\033[0m"
}

# --- Fonction de Bannissement (Simulation) ---
ban_ip_internal() {
    local IP_ADDRESS="\$1"
    local SIGNALEMENT_ID="\$2"
    local REASON="\$3"

    if grep -q "\$IP_ADDRESS" "\$IP_FILE" 2>/dev/null; then
        log_action "AVERTISSEMENT" "IP \$IP_ADDRESS déjà bannie. Maintien du ban."
        return 0
    fi

    echo "\$IP_ADDRESS # Raison: \$REASON | Signalement ID: \$SIGNALEMENT_ID" >> "\$IP_FILE"
    
    if [ \$? -eq 0 ]; then
        log_action "SUCCES" "IP \$IP_ADDRESS bannie préventivement (SIMULÉ)."
        return 0
    else
        log_action "ECHEC" "Échec de l'ajout de l'IP à la liste de ban."
        return 1
    fi
}


# --- Début du Traitement ---

if ! command -v jq &> /dev/null; then
    log_action "ECHEC" "L'outil 'jq' est requis. Installation nécessaire."
    exit 1
fi

log_action "INFO" "Démarrage du BAN immédiat sur \$INCOMING_DIR"
REPORTS_FOUND=0
REPORTS_PROCESSED=0

# On boucle sur tous les fichiers JSON dans le répertoire entrant
for REPORT_PATH in "\$INCOMING_DIR"/*.json; do

    if [ ! -f "\$REPORT_PATH" ]; then
        continue
    fi

    REPORTS_FOUND=\$((REPORTS_FOUND + 1))
    REPORT_FILE_NAME=\$(basename "\$REPORT_PATH")
    REPORT_BASE_NAME=\${REPORT_FILE_NAME%.json} # Nom sans l'extension

    # Chemin du fichier PNG correspondant (il se peut qu'il n'existe pas)
    SCREENSHOT_PATH="\$INCOMING_DIR/\$REPORT_BASE_NAME.png"

    # Extraction de l'IP, ID et Raison
    READ_DATA=\$(jq -r '[.reportedIP, .reportedId, .reason] | @tsv' "\$REPORT_PATH" 2>/dev/null)
    
    if [ -z "\$READ_DATA" ]; then
        log_action "ECHEC" "Erreur d'extraction JSON. Fichier ignoré: \$REPORT_FILE_NAME."
        continue
    fi
    
    IP_ADDRESS=\$(echo "\$READ_DATA" | awk '{print \$1}')
    SIGNALEMENT_ID=\$(echo "\$READ_DATA" | awk '{print \$2}')
    REASON=\$(echo "\$READ_DATA" | awk '{print \$3}')

    if [ "\$IP_ADDRESS" == "null" ] || [ -z "\$IP_ADDRESS" ]; then
        log_action "AVERTISSEMENT" "IP manquante dans le rapport JSON. Fichier ignoré."
        continue
    fi

    # 1. Bannissement de l'IP
    ban_ip_internal "\$IP_ADDRESS" "\$SIGNALEMENT_ID" "\$REASON"

    # 2. Déplacement du rapport JSON vers la file d'attente
    if mv "\$REPORT_PATH" "\$PENDING_DIR/\$REPORT_FILE_NAME"; then
        log_action "SUCCES" "Rapport JSON déplacé vers file d'attente."
        
        # 3. Déplacement de la capture PNG si elle existe
        if [ -f "\$SCREENSHOT_PATH" ]; then
            mv "\$SCREENSHOT_PATH" "\$PENDING_DIR/\$REPORT_BASE_NAME.png"
            log_action "SUCCES" "Capture PNG déplacée."
        fi

        REPORTS_PROCESSED=\$((REPORTS_PROCESSED + 1))
    else
        log_action "ECHEC" "Échec du déplacement vers file d'attente. Vérifiez les permissions."
    fi

done

log_action "INFO" "Fin du BAN immédiat. \$REPORTS_PROCESSED sur \$REPORTS_FOUND nouveaux rapports traités."
exit 0
