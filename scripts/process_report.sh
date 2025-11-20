#!/bin/bash
# Ce script permet de boucler sur les rapports et d'appliquer des actions
# telles que les marquer 'traiter', les 'supprimer', ou les 'mail_pharos',
# ou de débannir un 'faux_positif'.

# --- Configuration ---
REPORT_DIR="../logs/reports"
LOG_FILE="../logs/report_actions.log"
PHAROS_MAIL="pharos_contact@legalshufflecam.com"

# --- Fonctions de Log ---
log_action() {
    local TYPE="$1"
    local MESSAGE="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [$TYPE] - $MESSAGE" | tee -a "$LOG_FILE"
}

# --- Fonction d'Usage ---
usage() {
    echo "Usage: $0 <action>"
    echo "Actions disponibles :"
    echo "  traiter             : Simule la mise à jour du statut dans une base de données externe."
    echo "  supprimer           : Supprime le fichier JSON du rapport."
    echo "  mail_pharos         : Envoie le contenu du rapport à $PHAROS_MAIL."
    echo "  faux_positif        : Déban l'IP signalée et supprime le rapport (NÉCESSITE SUDO)."
    echo ""
    exit 1
}

# --- Vérification des Arguments ---

if [ "$#" -ne 1 ]; then
    usage
fi

ACTION="$1"
REPORT_COUNT=0
PROCESSED_COUNT=0

# --- Boucle de Traitement des Fichiers JSON ---

log_action "INFO" "Démarrage du traitement de l'action '$ACTION' dans le répertoire: $REPORT_DIR"

# Parcourir tous les fichiers *.json dans le répertoire de rapports
for REPORT_PATH in "$REPORT_DIR"/*.json; do

    # Vérifier si l'opération find a retourné un fichier ou le motif de recherche
    if [ ! -f "$REPORT_PATH" ]; then
        continue
    fi

    REPORT_COUNT=$((REPORT_COUNT + 1))
    REPORT_FILE_NAME=$(basename "$REPORT_PATH")

    # 1. Extraction des informations du JSON
    IP_TO_ACT_ON=$(jq -r '.reportedIP' "$REPORT_PATH" 2>/dev/null)

    # 2. Vérification de l'extraction de l'IP
    if [ -z "$IP_TO_ACT_ON" ] || [ "$IP_TO_ACT_ON" == "null" ]; then
        log_action "AVERTISSEMENT" "Impossible d'extraire reportedIP du fichier $REPORT_FILE_NAME. Fichier ignoré."
        continue
    fi

    log_action "TENTATIVE" "Traitement du rapport $REPORT_FILE_NAME (IP: $IP_TO_ACT_ON)"

    # 3. Exécution de l'action
    case "$ACTION" in
        traiter)
            echo " Rapport $REPORT_FILE_NAME : Mise 'en cours de traitement'..."
            # Simule l'appel à votre DB/API.
            sleep 0.1 # Remplacer par la vraie commande DB/API

            if [ $? -eq 0 ]; then
                log_action "SUCCES" "Simulé: Mise à jour du statut dans la DB pour IP $IP_TO_ACT_ON."
                PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
            else
                log_action "ECHEC" "Échec du traitement simulé pour IP $IP_TO_ACT_ON."
            fi
            ;;

        supprimer)
            echo " Rapport $REPORT_FILE_NAME : Suppression du fichier JSON..."
            rm -f "$REPORT_PATH"

            if [ $? -eq 0 ]; then
                log_action "SUCCES" "Fichier JSON du rapport supprimé."
                PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
            else
                log_action "ECHEC" "Échec de la suppression du fichier JSON."
            fi
            ;;

        mail_pharos)
            echo " Rapport $REPORT_FILE_NAME : Envoi de mail à PHAROS ($PHAROS_MAIL)..."

            # Utilisation du contenu du fichier JSON dans le corps du mail (nécessite 'mailx')
            mailx -s "Signalement Urgent IP $IP_TO_ACT_ON" "$PHAROS_MAIL" < "$REPORT_PATH"

            if [ $? -eq 0 ]; then
                log_action "SUCCES" "Mail PHAROS envoyé pour IP $IP_TO_ACT_ON."
                PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
            else
                log_action "ECHEC" "Échec envoi mail PHAROS."
            fi
            ;;

        faux_positif)
            echo " Rapport $REPORT_FILE_NAME : Déban de l'IP $IP_TO_ACT_ON et suppression du rapport..."
            
            # Appel du script de déban sécurisé (Nécessite SUDO !)
            sudo ../scripts/unban_ip_manually.sh "$IP_TO_ACT_ON"

            if [ $? -eq 0 ]; then
                # Si le déban réussit, supprimer le fichier du rapport
                rm -f "$REPORT_PATH"
                log_action "SUCCES" "Déban et Suppression du rapport pour IP $IP_TO_ACT_ON (Faux Positif)."
                PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
            else
                log_action "ECHEC" "Échec du Déban pour IP $IP_TO_ACT_ON. Rapport non supprimé."
            fi
            ;;

        *)
            echo "❌  ERREUR: Action '$ACTION' inconnue."
            log_action "ECHEC" "Action '$ACTION' inconnue. Arrêt du traitement."
            usage
            ;;
    esac

done

# --- Conclusion ---

log_action "INFO" "Fin du traitement. $PROCESSED_COUNT rapports traités sur $REPORT_COUNT trouvés."
echo "Traitement de l'action '$ACTION' terminé. $PROCESSED_COUNT rapports traités."

exit 0
