# Roadmap LegalShuffleCam

## M0 — Base stable
- [x] Nginx TLS + reverse proxy vers app (3000) et `/gocam/` (3300)
- [x] PM2 auto-boot + logs OK
- [x] coTURN 3478 TCP/UDP en ligne
- [ ] .env propre + variables manquantes documentées
- [ ] Endpoints `/health` pour checks et monitoring
- [ ] no ip show
- [ ] 2 mode cam : cam 50 50 tool bar between
- [ ] bloquer les bots wordpress qui flood les log nginx

## M1 — Âge / accès (GO.cam)
- [ ] Intégrer GO.cam (overlay ou redirect)
- [ ] Clé/API GO.cam
- [ ] Callback succès `POST /age/callback`
- [ ] Gate sur page d’accueil : blocage si non vérifié
- [ ] Fallback si GO.cam down

## M2 — Présence visage (anti cam noire)
- [ ] FaceDetector côté client
- [ ] Anneau rouge/vert selon détection visage
- [ ] Désactiver bouton “Suivant” si pas de visage
- [ ] Option serveur pour contrôle anti-triche

## M3 — Détection nudité (NSFW)
- [ ] Modèle nsfwjs côté client
- [ ] Analyse throttlée (2–3 fps)
- [ ] Compteur infractions serveur
- [ ] Blocage et ban progressif

## M4 — Mouvements suspects
- [ ] Détection mouvement par frame diff ou pose estimation
- [ ] Bot check par inactivité prolongée

## M5 — Bouton Signaler
- [ ] Modal motif de signalement
- [ ] API `POST /report` avec IP anonymisée, UA, pays, peer IDs
- [ ] Taux-limitation
- [ ] Soft-ban / ban auto
- [ ] Outil admin pour gérer reports

## M6 — Vidéos placeholders
- [ ] Playlist mini-vidéos locales
- [ ] Affichage si queue vide

## M7 — Anti-abus & résilience
- [ ] Rate limit Nginx
- [ ] Banlist temporaire (fail2ban-like)
- [ ] CSP/Permissions-Policy strictes
- [ ] Logs structurés JSON + rotation
- [ ] Metrics usage


M0.1 — Sélecteur caméra minimaliste
  Remplacement du bouton 📷 par un <select> intégré
  Liste dynamique des caméras via enumerateDevices()
  Démarrage automatique de la première caméra détectée
  Changement à la volée sans reload
  Aucun impact sur layout ni proportions
  Pas de dépendance externe, pas de menu flottant
  Commit : feat: remplacement du bouton 📷 par un select caméra minimaliste
