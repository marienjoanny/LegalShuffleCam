# 📊 Stats & conformité — LegalShuffleCam

Ce document résume **où** sont écrites les infos minimales (comptage & traçabilité) et **comment** les consulter, en visant la conformité (conservation limitée, accès restreint).

---

## 1) Journaux écrits

- **Connexions** → `/var/log/legalshufflecam/connections.log`  
  Format par ligne (CSV safe) :
\`\`\`
ISO8601,"EVENT","IP","SOCKET_ID",{"ua":"...","country":"FR"}
\`\`\`
`EVENT` ∈ `CONNECT` | `DISCONNECT`.

- **Métriques (optionnel)** → `/var/log/legalshufflecam/metrics.log`  
  Exemple :
\`\`\`
ISO8601 | active=12 | pairs=4 | joins=132 | leaves=118
\`\`\`

---

## 2) Commandes utiles

- Suivre les connexions en direct :
\`\`\`bash
sudo tail -f /var/log/legalshufflecam/connections.log
\`\`\`

- Suivre les métriques (si activées) :
\`\`\`bash
sudo tail -f /var/log/legalshufflecam/metrics.log
\`\`\`

- Compter les connexions du jour :
\`\`\`bash
sudo grep -F "$(date -I)" /var/log/legalshufflecam/connections.log | wc -l
\`\`\`

---

## 3) Rétention & sécurité (recommandé)

- **Rétention** : rotation quotidienne + conservation courte (ex. 7 à 30 jours).  
- **Accès** : répertoires en lecture seule pour les non-admins (ex. `chmod 750`), journaux créés par le service.
- **Finalité** : modération, sécurité, obligations légales (sur demande des autorités).
- **Pas de contenu** capturé, uniquement métadonnées techniques minimales.

Pour activer la rotation (exemple `logrotate`) :
\`\`\`bash
sudo tee /etc/logrotate.d/legalshufflecam >/dev/null <<'ROT'
/var/log/legalshufflecam/*.log {
  daily
  rotate 14
  missingok
  compress
  delaycompress
  notifempty
  create 0640 ubuntu ubuntu
  sharedscripts
  postrotate
    pm2 reloadLogs >/dev/null 2>&1 || true
  endscript
}
ROT
\`\`\`

---

## 4) Points de contrôle rapides

- `pm2 logs legalshufflecam` : vérifie les événements socket (JOIN/LEAVE/MATCH).  
- `ss -ltnup | grep :3478` : TURN en écoute (si utilisé).  
- `curl -I https://legalshufflecam.ovh/gocam/` : endpoint GO.cam OK.

