# LegalShuffleCam

Plateforme minimaliste de webcam aléatoire avec logique de filtrage facial et respect de la vie privée.

---

## 📦 Fonctionnalités principales

- 🔒 Vérification d’âge via cookie `age_verified`
- 🎥 Flux vidéo local et distant (`localVideo`, `remoteVideo`)
- 🧠 Détection de visage via `face-guard.js` (TensorFlow BlazeFace)
- ⚠ Affichage IP et avertissement comportemental
- 📤 Bouton "Signaler" pour signaler un comportement inapproprié

---

## 🎥 Sélection de caméra (Octobre 2025)

Ajout d’un `<select>` minimaliste dans `index-real.php` :

- Remplace le bouton 📷 par un menu déroulant intégré
- Liste toutes les caméras disponibles via `enumerateDevices()`
- Démarre automatiquement la première caméra détectée
- Permet de changer de caméra à la volée
- Aucun impact sur le layout ni les proportions

Commit associé :
```bash
git commit -m "feat: remplacement du bouton 📷 par un select caméra minimaliste"
```

---

## 🧪 Fichiers utiles

- `public/test-cookie.php` : vérification manuelle du cookie `age_verified`
- `public/index-real.php` : version active avec sélection caméra
- `ROADMAP.md` : planification des évolutions
- `listener.js` : logique serveur (si utilisé avec WebRTC ou socket)

---

## 🚀 Déploiement

```bash
# Cloner le projet
git clone <repo>

# Lancer en local (si Node.js)
node server.js
```

---

## 🧼 Philosophie

> KISS — Keep It Simple, Stupid  
> Chaque modification est explicite, réversible, et documentée.  
> Pas de dépendances inutiles. Pas de surprises visuelles.  
> Juste du contrôle, de la clarté, et du respect utilisateur.
