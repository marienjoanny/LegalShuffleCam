#!/bin/bash
# Script interactif pour la revue humaine des rapports de bannissement.
# Ce script DOIT être exécuté avec SUDO.

# --- Configuration et chemins (Relatif à l'exécution dans /scripts) ---
REPORT_DIR="../logs/reports/"
STAGING_DIR="${REPORT_DIR}banned_but_pending_review/" # C'est le dossier qui contient les bans en attente de validation humaine
PROCESSED_DIR="${REPORT_DIR}processed/"
ESCALATED_DIR="${REPORT_DIR}escalated/"
UNBAN_SCRIPT="./unban_ip_manually.sh"
ACTION_LOG="../logs/report_actions.log" 
IP_REGEX="^([0-9]{1,3}\.){3}[0-9]{1,3}$"

# --- Fonctions de Log ---
log_action() {
    local TYPE="$1"
    local MESSAGE="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [$TYPE] - $MESSAGE" | tee -a "$ACTION_LOG"
}

# --- Initialisation et Prérequis ---
if [ "$(id -u)" -ne 0 ]; then
    log_action "ERREUR" "Doit être exécuté avec 'sudo' ou par 'root'."
    echo "ERREUR: Veuillez exécuter ce script avec 'sudo'."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_action "ERREUR" "L'outil 'jq' est manquant. Veuillez l'installer (sudo apt install jq)."
    echo "ERREUR: 'jq' est manquant. Installation nécessaire."
    exit 1
fi

log_action "INFO" "Démarrage de la session de modération interactive."

# --- Fonction principale de traitement d'un rapport ---
process_report() {
    local REPORT_PATH="$1"
    local REPORT_FILE_NAME=$(basename "$REPORT_PATH")
    
    # Lecture des données du JSON (CORRIGÉ : utilisation des clés miniuscules 'reportedId', 'reporterId', 'screenshotFile')
    local IP_TO_AFFECT=$(jq -r '.reportedIP' "$REPORT_PATH" 2>/dev/null)
    local REASON=$(jq -r '.reason' "$REPORT_PATH" 2>/dev/null)
    local REPORTED_ID=$(jq -r '.reportedId' "$REPORT_PATH" 2>/dev/null)
    local REPORTER_ID=$(jq -r '.reporterId' "$REPORT_PATH" 2>/dev/null)
    local IMAGE_FILE=$(jq -r '.screenshotFile' "$REPORT_PATH" 2>/dev/null)

    # Affichage des informations
    echo ""
    echo "------------------------------------------------------------------------"
    echo "FICHIER: $REPORT_FILE_NAME"
    echo "IP BANNIE: $IP_TO_AFFECT"
    echo "ID Signalé: $REPORTED_ID / ID Signaleur: $REPORTER_ID"
    echo "RAISON: $REASON"
    # Affichage de la commande SCP avec le nom de fichier correct
    echo "Capture : scp root@<SERVEUR>:/var/www/legalshufflecam/logs/reports/images/$IMAGE_FILE ~/temp/"
    echo "------------------------------------------------------------------------"
    
    # Boucle de demande d'action
    while true; do
        echo "Action [V/U/E/S/Q] : V)alider le Ban, U)nban (Faux Positif), E)scalader, S)auter (Passer), Q)uitter la session"
        read -r -n 1 -p "Votre choix : " ACTION
        echo "" # Nouvelle ligne après la saisie
        
        case "$ACTION" in
            [Vv])
                # VALIDER (Ban OK, Archiver)
                mv "$REPORT_PATH" "$PROCESSED_DIR"
                log_action "MOD_VALIDATE" "Validation manuelle du ban pour IP $IP_TO_AFFECT. Rapport $REPORT_FILE_NAME archivé."
                echo "✅ Ban validé. Rapport archivé."
                return 0
                ;;
            
            [Uu])
                # UNBAN (Faux Positif)
                if [[ ! "$IP_TO_AFFECT" =~ $IP_REGEX ]]; then
                    echo "ERREUR: IP invalide ('$IP_TO_AFFECT'). Impossible de débannir."
                    log_action "ERREUR" "Tentative de déban pour IP invalide: $IP_TO_AFFECT dans $REPORT_FILE_NAME."
                    continue
                fi
                
                # Exécution du script de déban
                "$UNBAN_SCRIPT" "$IP_TO_AFFECT"
                
                # Archivage du rapport après le déban
                mv "$REPORT_PATH" "$PROCESSED_DIR"
                log_action "MOD_UNBAN" "Faux Positif: IP $IP_TO_AFFECT débannie. Rapport $REPORT_FILE_NAME archivé."
                echo "❌ Faux Positif traité. IP débannie et rapport archivé."
                return 0
                ;;
                
            [Ee])
                # ESCALADER (Mettre de côté pour une seconde opinion)
                mv "$REPORT_PATH" "$ESCALATED_DIR"
                log_action "MOD_ESCALATE" "Escalade: Rapport $REPORT_FILE_NAME déplacé vers escalated."
                echo "⬆️ Rapport escaladé et mis de côté."
                return 0
                ;;

            [Ss])
                # SAUTER (Passer le rapport pour le traiter plus tard)
                echo "⏩ Rapport sauté. Repassez le script plus tard."
                return 0
                ;;
                
            [Qq])
                # QUITTER (Arrêter la session)
                log_action "INFO" "Session de modération interrompue par l'utilisateur."
                exit 0
                ;;
            
            *)
                echo "Choix invalide. Veuillez saisir V, U, E, S ou Q."
                ;;
        esac
    done
}

# --- Boucle principale sur tous les fichiers ---

echo "Début de la revue des rapports dans le dossier : $STAGING_DIR"

while true; do
    # Recherche du premier fichier JSON dans le dossier de staging
    FIRST_REPORT=$(find "$STAGING_DIR" -maxdepth 1 -type f -name "*.json" | head -n 1)

    if [ -z "$FIRST_REPORT" ]; then
        echo ""
        echo "------------------------------------------------------------------------"
        log_action "INFO" "Fin du traitement. Dossier $STAGING_DIR vide."
        echo "🎉 Tous les rapports en revue humaine ont été traités. Fin de session."
        echo "------------------------------------------------------------------------"
        break
    fi

    # Traiter le rapport trouvé
    process_report "$FIRST_REPORT"

done

exit 0
