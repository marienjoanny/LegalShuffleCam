#!/bin/bash
# Script pour débannir manuellement une adresse IP de la chaîne LEGALSHUFFLECAM_BAN.
# Ce script est appelé par 'process_report.sh faux_positif'.
# Utilisation: sudo ./unban_ip_manually.sh <adresse_ip>

# --- Configuration ---
PERSISTENT_BAN_FILE="../data/banned_ips.txt"
LOG_FILE="../logs/report_actions.log" # Log dans le même fichier que process_report

# --- Fonctions de Log ---
log_action() {
    local TYPE="$1"
    local MESSAGE="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [$TYPE] - $MESSAGE" | tee -a "$LOG_FILE"
}

# --- Vérification des Permissions et Arguments ---

if [ "$(id -u)" -ne 0 ]; then
    echo "ERREUR: Ce script doit être exécuté avec 'sudo' (par le script process_report.sh)."
    log_action "ERREUR" "Tentative de déban sans privilèges root."
    exit 1
fi

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <adresse_ip>"
    log_action "ERREUR" "Déban manuel appelé avec un nombre d'arguments incorrect."
    exit 1
fi

IP_TO_UNBAN="$1"

# --- 1. Validation de l'IP (Sécurité) ---
if [[ ! "$IP_TO_UNBAN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo "ERREUR: Format d'adresse IP invalide: $IP_TO_UNBAN"
    log_action "ERREUR" "Tentative de déban avec format d'IP invalide: $IP_TO_UNBAN."
    exit 1
fi

echo "Tentative de débannissement manuel de l'IP : $IP_TO_UNBAN"

# --- 2. Retirer la Règle IPTables ---

# Trouver le numéro de ligne de la règle à retirer
# Nous utilisons 'awk' et 'head -n 1' pour trouver le premier numéro de ligne correspondant à l'IP.
LINE_NUMBER=$(iptables -nL LEGALSHUFFLECAM_BAN --line-numbers 2>/dev/null | grep " $IP_TO_UNBAN " | awk '{print $1}' | head -n 1)

if [ -z "$LINE_NUMBER" ]; then
    echo "ATTENTION: L'IP $IP_TO_UNBAN n'est pas (ou plus) bannie dans IPTables."
    log_action "AVERTISSEMENT" "Déban demandé pour IP $IP_TO_UNBAN, mais règle IPTables introuvable."
else
    # Retirer la règle par son numéro de ligne pour éviter toute ambiguïté
    iptables -D LEGALSHUFFLECAM_BAN "$LINE_NUMBER"
    
    if [ $? -eq 0 ]; then
        log_action "SUCCES" "Déban APPLIQUÉ à l'IP $IP_TO_UNBAN (Règle IPTables retirée)."
    else
        log_action "ECHEC" "Échec critique lors du retrait de la règle IPTables pour IP $IP_TO_UNBAN."
        exit 1
    fi
fi

# --- 3. Retirer l'IP de la Liste Persistante ---
if [ -f "$PERSISTENT_BAN_FILE" ]; then
    # Utiliser sed pour supprimer la ligne contenant l'IP (correspondance exacte en début/fin de ligne).
    sed -i "/^$IP_TO_UNBAN$/d" "$PERSISTENT_BAN_FILE"
    log_action "INFO" "IP $IP_TO_UNBAN retirée de la liste persistante."
else
    log_action "AVERTISSEMENT" "Fichier de liste persistante ($PERSISTENT_BAN_FILE) introuvable."
fi

# --- 4. Sauvegarder les règles IPTables persistantes (IMPORTANT pour éviter la réapparition au reboot) ---
if command -v netfilter-persistent &> /dev/null; then
    netfilter-persistent save
    log_action "INFO" "Règles IPTables persistantes sauvegardées."
fi

echo -e "\n--- STATUT DÉBAN IP $IP_TO_UNBAN ---"
if iptables -nL LEGALSHUFFLECAM_BAN 2>/dev/null | grep -q " $IP_TO_UNBAN "; then
    echo "ÉCHEC: L'IP $IP_TO_UNBAN est toujours présente dans la chaîne."
    exit 1
else
    echo "IP retirée avec succès de la chaîne iptables."
fi

exit 0
