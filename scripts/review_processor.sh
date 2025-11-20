#!/bin/bash

# ==============================================================================
# SCRIPT DE REVUE ET DE DÉCISION MANUELLE (review_processor.sh)
# Rôle: Permettre à l'opérateur humain de prendre la décision finale (PHAROS, Ban permanent, Deban).
#
# LOGIQUE LÉGALE : 
# - revue_legale : Envoie les cas critiques à PHAROS, puis supprime le rapport.
# - lister_restant : Liste les cas non-critiques, affiche le fichier PNG et la commande SCP.
# - debannir <IP> : Pour les faux positifs (retire le ban IP, supprime le rapport).
# - supprimer_tout : Supprime tous les rapports restants (Ban IP maintenu).
# =UTE 
# Paramètres Termux/SSH de l'utilisateur pour construire la commande SCP
SSH_USER="root"
SSH_HOST="217.154.118.144"
SSH_KEY_PATH="/storage/emulated/0/Documents/ssh/id_rsa_connectbot"
LOCAL_DOWNLOAD_DIR="/sdcard/Download" # Répertoire de téléchargement sur Termux

# Répertoire des rapports en attente de revue
PENDING_DIR="/var/www/legalshufflecam/logs/reports/pending_review" 
# Fichier de la liste de simulation des IPs bannies
IP_FILE="/var/www/legalshufflecam/data/banned_ips.txt" 
PHAROS_MAIL="pharos@interieur.gouv.fr"

# Motifs qui déclenchent OBLIGATOIREMENT le mail PHAROS (à adapter)
CRITICAL_MOTIFS="Mineur|Sexuel|Nudite|Zoophilie|Apologie du terrorisme"

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
        TENTATIVE) COLOR='\033[0;36m';;
        *)       COLOR='\033[0m';;
    esac

    echo -e "${COLOR}[$TIMESTAMP] [$TYPE] $MESSAGE\033[0m"
}

# --- Fonction de Debannissement (Simulation) ---
unban_ip_internal() {
    local IP_ADDRESS="\$1"
    
    if ! grep -q "\$IP_ADDRESS" "\$IP_FILE" 2>/dev/null; then
        log_action "AVERTISSEMENT" "IP \$IP_ADDRESS n'est pas dans la liste de ban."
        return 1
    fi

    # Suppression de l'IP de la liste de ban (Simulation)
    # Le pattern est l'IP au début de la ligne, pour éviter de supprimer les lignes de commentaires
    sed -i "/^\$IP_ADDRESS/d" "\$IP_FILE"

    if [ \$? -eq 0 ]; then
        log_action "SUCCES" "IP \$IP_ADDRESS retirée de la liste de ban (DEBANNIE)."
        return 0
    else
        log_action "ECHEC" "Échec de la suppression de l'IP de la liste de ban."
        return 1
    fi
}

# --- Fonction d'Envoi Mail PHAROS ---
mail_pharos_internal() {
    local REPORT_PATH="\$1"
    local SIGNALEMENT_ID="\$2"
    local CALLER_ID="\$3"
    local REASON="\$4"
    local IP_ADDRESS="\$5" 
    local SCREENSHOT_FILE="\$6"

    if ! command -v mailx &> /dev/null; then
        log_action "ECHEC" "L'outil 'mailx' est requis pour l'envoi de mail. Fichier ignoré."
        return 1
    fi

    log_action "TENTATIVE" "Envoi PHAROS pour raison CRITIQUE (\$REASON)..."

    MAIL_BODY="Signalement Urgent pour LegalShuffleCam.\n\n"
    MAIL_BODY+="ID Cible: \$SIGNALEMENT_ID\n"
    MAIL_BODY+="IP Cible: \$IP_ADDRESS\n" 
    MAIL_BODY+="Motif: \$REASON\n"
    MAIL_BODY+="Capture: \$(basename "\$SCREENSHOT_FILE")\n" 
    MAIL_BODY+="Contenu du fichier JSON:\n\n"
    MAIL_BODY+="\$(cat "\$REPORT_PATH")\n"

    # Le chemin complet de l'image
    ATTACHMENT_PATH="\$(dirname "\$REPORT_PATH")/\$SCREENSHOT_FILE"

    if [ -f "\$ATTACHMENT_PATH" ]; then
        # Envoi avec pièce jointe 
        echo -e "\$MAIL_BODY" | mailx -a "\$ATTACHMENT_PATH" -s "OBLIGATION LÉGALE - \$REASON Cible: \${SIGNALEMENT_ID:0:8}..." "\$PHAROS_MAIL"
    else
        # Envoi sans pièce jointe si l'image n'est pas trouvée
        log_action "AVERTISSEMENT" "Image de preuve non trouvée (\$SCREENSHOT_FILE). Envoi sans pièce jointe."
        echo -e "\$MAIL_BODY" | mailx -s "OBLIGATION LÉGALE - \$REASON Cible: \${SIGNALEMENT_ID:0:8}..." "\$PHAROS_MAIL"
    fi


    if [ \$? -eq 0 ]; then
        log_action "SUCCES" "Mail PHAROS envoyé."
        return 0
    else
        log_action "ECHEC" "Échec envoi mail PHAROS."
        return 1
    fi
}

# --- Fonction d'Aide ---
usage() {
    echo "Usage: \$0 <action> [arguments]"
    echo ""
    echo "ÉTAPE 1 : Revue des obligations légales (À lancer en premier) :"
    echo "  revue_legale   : Envoie les rapports CRITIQUES (Légal) à PHAROS, supprime le rapport JSON ET le PNG."
    echo ""
    echo "ÉTAPE 2 : Revue des cas non-critiques (Insultes, Spam, etc.) :"
    echo "  lister_restant : Affiche les rapports restant à traiter (Ban IP en cours) avec la COMMANDE SCP."
    echo "  supprimer_tout : Supprime TOUS les rapports restants (Ban IP maintenu)."
    echo "  debannir <IP>  : FAUX POSITIF : Supprime l'IP de la liste de ban ET supprime le rapport (JSON + PNG)."
    echo ""
    log_action "INFO" "Dossier de revue : \$PENDING_DIR"
    exit 1
}

# --- Début du Traitement ---

if ! command -v jq &> /dev/null; then
    log_action "ECHEC" "L'outil 'jq' est requis. Installation nécessaire."
    exit 1
fi

ACTION="\$1"
if [ -z "\$ACTION" ]; then
    usage
fi

# --- Gestion de l'action DEBAN MANUELLE (hors boucle) ---
if [ "\$ACTION" == "debannir" ]; then
    if [ -z "\$2" ]; then
        echo "❌  ERREUR: L'action 'debannir' nécessite l'adresse IP en argument."
        usage
    fi
    IP_TO_UNBAN="\$2"

    unban_ip_internal "\$IP_TO_UNBAN"
    UNBAN_STATUS=\$?

    # Chercher un rapport JSON correspondant (le premier trouvé)
    REPORT_PATH=\$(grep -l "\$IP_TO_UNBAN" "\$PENDING_DIR"/*.json 2>/dev/null | head -n 1)

    if [ -f "\$REPORT_PATH" ]; then
        # 1. Lecture du nom de la capture
        SCREENSHOT_NAME=\$(jq -r '.screenshotFile' "\$REPORT_PATH")
        SCREENSHOT_PATH="\$(dirname "\$REPORT_PATH")/\$SCREENSHOT_NAME"

        # 2. Suppression du JSON
        rm -f "\$REPORT_PATH"
        log_action "SUCCES" "Rapport JSON supprimé: \$(basename "\$REPORT_PATH")."

        # 3. Suppression du PNG
        if [ -f "\$SCREENSHOT_PATH" ] && [ "\$SCREENSHOT_NAME" != "None" ] && [ "\$SCREENSHOT_NAME" != "null" ]; then
            rm -f "\$SCREENSHOT_PATH"
            log_action "SUCCES" "Capture PNG supprimée: \$(basename "\$SCREENSHOT_PATH")."
        else
            log_action "AVERTISSEMENT" "Pas de capture PNG à supprimer pour l'IP \$IP_TO_UNBAN."
        fi
    else
        log_action "AVERTISSEMENT" "Aucun rapport JSON trouvé dans la file d'attente pour l'IP \$IP_TO_UNBAN."
    fi
    exit 0
fi


# --- Boucle de Traitement (Actions de masse) ---
REPORTS_PROCESSED=0
REPORTS_FOUND=0
LISTING_OUTPUT=""

for REPORT_PATH in "\$PENDING_DIR"/*.json; do
    if [ ! -f "\$REPORT_PATH" ]; then
        continue
    fi

    REPORTS_FOUND=\$((REPORTS_FOUND + 1))
    REPORT_FILE_NAME=\$(basename "\$REPORT_PATH")

    # Extraction des données + NOUVEAU : screenshotFile
    READ_DATA=\$(jq -r '[.reportedIP, .reportedId, .reporterId, .reason, .screenshotFile] | @tsv' "\$REPORT_PATH" 2>/dev/null)
    
    if [ -z "\$READ_DATA" ]; then
        log_action "AVERTISSEMENT" "Erreur d'extraction JSON. Fichier ignoré: \$REPORT_FILE_NAME."
        continue
    fi
    
    IP_ADDRESS=\$(echo "\$READ_DATA" | awk '{print \$1}')
    SIGNALEMENT_ID=\$(echo "\$READ_DATA" | awk '{print \$2}')
    CALLER_ID=\$(echo "\$READ_DATA" | awk '{print \$3}')
    REASON=\$(echo "\$READ_DATA" | awk '{print \$4}')
    SCREENSHOT_FILE=\$(echo "\$READ_DATA" | awk '{print \$5}')
    
    # Chemin complet de l'image (si elle existe)
    SCREENSHOT_PATH="\$(dirname "\$REPORT_PATH")/\$SCREENSHOT_FILE"


    case "\$ACTION" in
        revue_legale)
            # Vérification des motifs critiques légaux
            if echo "\$REASON" | grep -Eq "(\$CRITICAL_MOTIFS)"; then
                log_action "INFO" "CAS CRITIQUE DÉTECTÉ : \$REASON (IP: \$IP_ADDRESS)"
                mail_pharos_internal "\$REPORT_PATH" "\$SIGNALEMENT_ID" "\$CALLER_ID" "\$REASON" "\$IP_ADDRESS" "\$SCREENSHOT_FILE" 
                
                if [ \$? -eq 0 ]; then
                    rm -f "\$REPORT_PATH" # Suppression JSON
                    if [ -f "\$SCREENSHOT_PATH" ]; then
                        rm -f "\$SCREENSHOT_PATH" # Suppression PNG
                    fi
                    log_action "SUCCES" "Rapport critique (JSON + PNG) envoyé à PHAROS et supprimé."
                    REPORTS_PROCESSED=\$((REPORTS_PROCESSED + 1))
                fi
            else
                # Cas non-critiques (laissé en attente pour les actions lister_restant, supprimer_tout, debannir)
                REPORTS_PROCESSED=\$((REPORTS_PROCESSED + 1))
            fi
            ;;

        lister_restant)
            # Affiche uniquement les rapports non critiques restants
            if ! echo "\$REASON" | grep -Eq "(\$CRITICAL_MOTIFS)"; then
                
                LISTING_OUTPUT+="\n\n"
                LISTING_OUTPUT+="----------------------------------------------------------\n"
                LISTING_OUTPUT+="📋 Rapport: \$REPORT_FILE_NAME\n"
                LISTING_OUTPUT+="    ID Cible: \${SIGNALEMENT_ID:0:8}...\n"
                LISTING_OUTPUT+="    IP Bannie: \$IP_ADDRESS\n"
                LISTING_OUTPUT+="    Motif: \$REASON\n"
                LISTING_OUTPUT+="    Capture: \$SCREENSHOT_FILE\n"

                # Construction de la commande SCP
                if [ -f "\$SCREENSHOT_PATH" ] && [ "\$SCREENSHOT_FILE" != "None" ] && [ "\$SCREENSHOT_FILE" != "null" ]; then
                    LISTING_OUTPUT+="\n"
                    LISTING_OUTPUT+="➡️  COMMANDE SCP POUR TÉLÉCHARGER LA PREUVE (Termux) :\n"
                    LISTING_OUTPUT+="\033[0;33m" # Couleur Jaune pour la commande
                    LISTING_OUTPUT+="scp -i '\$SSH_KEY_PATH' '\$SSH_USER'@'\$SSH_HOST':\$SCREENSHOT_PATH '\$LOCAL_DOWNLOAD_DIR'/\$SCREENSHOT_FILE\n"
                    LISTING_OUTPUT+="\033[0m" # Réinitialiser la couleur
                else
                    LISTING_OUTPUT+="    (Pas de capture PNG à télécharger)\n"
                fi

                REPORTS_PROCESSED=\$((REPORTS_PROCESSED + 1))
            fi
            ;;

        supprimer_tout)
            # Suppression du rapport (ban IP maintenu)
            rm -f "\$REPORT_PATH"
            if [ -f "\$SCREENSHOT_PATH" ]; then
                rm -f "\$SCREENSCREENSHOT_PATH"
            fi

            if [ \$? -eq 0 ]; then
                log_action "SUCCES" "Rapport et PNG supprimés (Ban IP maintenu) : \$REPORT_FILE_NAME"
                REPORTS_PROCESSED=\$((REPORTS_PROCESSED + 1))
            else
                log_action "ECHEC" "Échec suppression rapport : \$REPORT_FILE_NAME"
            fi
            ;;

        *)
            log_action "ECHEC" "Action '\$ACTION' inconnue. Arrêt."
            usage
            ;;
    esac
done

if [ "\$ACTION" == "lister_restant" ]; then
    echo -e "\$LISTING_OUTPUT"
    echo "=========================================================="
    echo "Nombre de rapports non-critiques restants à réviser : \$REPORTS_PROCESSED"
fi

log_action "INFO" "Fin du traitement. \$REPORTS_PROCESSED rapports traités."
exit 0
