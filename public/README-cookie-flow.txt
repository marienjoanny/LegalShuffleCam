# Patch : Cookie d’âge vérifié stable (14 Oct 2025)

## Objectif
Corriger les pertes de cookie après retour Go.cam → garantir redirection vers /index-real.php.

## Symptômes initiaux
- Cookie parfois absent après retour
- Redirection vers SDK au lieu de /index-real.php
- Logs intermittents, comportement non déterministe

## Diagnostic
- Cookie posé sans SameSite=None → refusé en contexte cross-site
- Cookie sans secure → rejeté par Chrome
- Cookie sans domain → non partagé entre www. et root

## Correctifs appliqués
- setcookie() avec :
  - domain = `.legalshufflecam.ovh`
  - secure = true
  - samesite = None
- Redirection manuelle après retour Go.cam
- Logs explicites dans `avs-debug.log`
- Ajout de `test-cookie.php` et `log-cookie.php` pour vérification

## Fichiers modifiés
- `index.php`
- `README-cookie-flow.txt`
- `index.php.pre-cookie-stable.bak`

## Validation
- Testé avec curl et navigateur
- Cookie détecté → redirection vers `/index-real.php` confirmée
- Logs horodatés avec IP et UA

