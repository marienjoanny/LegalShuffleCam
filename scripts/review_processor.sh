#!/bin/bash

# Configuration
REPORT_DIR="./logs/reports"
IP_LIST_TEMP="./data/ips_to_ban.tmp"
THRESHOLD=1

echo "Analyse des rapports dans $REPORT_DIR..."

mkdir -p ./data
> "$IP_LIST_TEMP"

# Utilisation de 'jq -r' pour obtenir la sortie brute (CRITIQUE : supprime les guillemets)
find "$REPORT_DIR" -maxdepth 1 -name "*.json" -print0 | xargs -0 jq -r -s '
    map(.reportedIP)
    | group_by(.)[]
    | select(length >= '"$THRESHOLD"')
    | .[0]
    | select(. != null)
' 2>/dev/null | sort -u > "$IP_LIST_TEMP"

if [ -s "$IP_LIST_TEMP" ]; then
    echo "Analyse terminée. IPs à bannir stockées dans $IP_LIST_TEMP."
else
    echo "Analyse terminée. Aucune IP n'a atteint le seuil."
fi
