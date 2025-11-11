#!/bin/bash

REPO_DIR="/var/www/legalshufflecam"
cd "$REPO_DIR" || exit 1

echo "📝 Mise à jour du règlement..."
cat << 'HTML' > reglement.html
🧾 Règlement et Conditions d’Utilisation  
Legal ShuffleCam – Le Chat Vidéo Aléatoire Sécurisé et Conforme à la Loi Française

🎯 Mission  
Legal ShuffleCam connecte des adultes à travers des conversations vidéo aléatoires, dans le respect de la vie privée, de la loi et de la dignité de chacun.  
Notre priorité est de garantir un environnement sûr, respectueux et 100 % légal.

🚫 Activités strictement interdites  

👶 Accès réservé aux majeurs  
L’utilisation de Legal ShuffleCam est strictement réservée aux personnes âgées d’au moins 18 ans. Tout utilisateur mineur sera immédiatement banni.

📸 Nudité et cadrage  
La nudité non consentie, totale ou partielle, est interdite.  
Toutes les sessions débutent en cadrage visage uniquement, par défaut, pour garantir la sécurité et le respect mutuel.  
L’affichage de nudité ou de contenu intime n’est autorisé que si les deux utilisateurs ont donné leur consentement explicite via le bouton prévu à cet effet.  
Toute tentative de contournement, de nudité imposée ou de comportement sexuel non sollicité entraînera une exclusion immédiate.

❌ Comportements sexuels ou explicites  
Legal ShuffleCam est un espace de discussion entre adultes, mais le respect du consentement et de la loi reste impératif.  
Les comportements à caractère sexuel ne sont tolérés que si les deux utilisateurs ont donné leur consentement explicite via le bouton prévu à cet effet.  
Toute nudité ou geste intime imposé à autrui, sans consentement mutuel, constitue une violation grave et peut relever de l’article 222-32 du Code pénal (exhibition sexuelle imposée à autrui).  
Sont strictement interdits en l’absence de consentement :
- Présentation ou toucher de parties intimes  
- Gestes ou propos à caractère sexuel  
- Sollicitation ou tentative d’acte sexuel  

⚠️ Harcèlement et discrimination  
Aucun propos injurieux, harcelant ou discriminatoire ne sera toléré, qu’il soit fondé sur l’origine, la religion, le genre, l’orientation sexuelle, l’âge ou le handicap.

🚷 Contenu promotionnel  
La diffusion de liens, d’images ou de messages publicitaires vers d’autres sites, produits ou services est interdite.

🕳️ Activités illégales  
Traite ou exploitation humaine  
Prostitution ou services d’escorte  
Harcèlement, menace ou toute activité criminelle  

🤖 Manipulation et fraude  
L’usage de logiciels trompeurs (bots, émulateurs de webcam, deepfakes, etc.) est strictement interdit.

🛡️ Consentement et modération  
L’accès à l’affichage complet du flux vidéo nécessite le consentement explicite de chaque utilisateur, recueilli via le bouton prévu à cet effet.  
Par défaut, toutes les sessions débutent en cadrage visage uniquement, afin de garantir la sécurité, la dignité et le respect mutuel.  
Toute nudité ou contenu intime ne peut être affiché qu’après consentement mutuel. En l’absence de consentement, tout comportement sexuel ou exhibition imposée constitue une violation grave.  
Les modérateurs peuvent suspendre ou bannir tout compte suspecté d’enfreindre les règles, même en cas de consentement si le comportement reste contraire à la loi française.  
En cas de violation grave (ex. acte sexuel non consenti, mineur détecté, menace), les données de connexion (adresse IP, heure) pourront être transmises aux autorités compétentes conformément à la loi.

📢 Signalement des infractions  
Si vous êtes témoin d’un comportement inapproprié :
- Cliquez sur le bouton Signaler pendant la session.  
- Fournissez, si possible, une capture ou la date/heure du chat.  
- Les signalements multiples entraînent une suspension automatique du compte.

⚖️ Responsabilité  
Chaque utilisateur est seul responsable du contenu qu’il diffuse.  
Legal ShuffleCam ne saurait être tenu responsable des propos ou comportements des utilisateurs.  
L’accès au service peut être suspendu ou interrompu à tout moment pour maintenance, sécurité ou respect des lois.

🔐 Données personnelles (RGPD)  
Les adresses IP sont enregistrées uniquement à des fins de sécurité et de modération.  
Ces données sont conservées au maximum 30 jours puis automatiquement supprimées.  
Le traitement repose sur l’intérêt légitime de l’éditeur pour assurer la sécurité du service.  
Aucune donnée personnelle n’est partagée ni revendue à des tiers.  
Les actions de modération sont archivées à des fins de traçabilité et d’amélioration du service.  
Conformément au RGPD (UE 2016/679), vous disposez d’un droit d’accès, de rectification, de suppression et d’opposition concernant vos données.

📧 Pour exercer ces droits, vous pouvez écrire à : marienjoanny@gmail.com

🍪 Cookies  
Ce site utilise uniquement des cookies techniques essentiels à son fonctionnement, notamment pour la vérification d’âge via Go.cam.  
Aucun cookie publicitaire ou de traçage tiers n’est utilisé.  
Un bandeau d’information est affiché lors de la première visite.  
Ces cookies ne contiennent aucune donnée personnelle et sont exemptés de consentement conformément aux lignes directrices de la CNIL (délibération n°2020-092).

🧱 Mentions légales  
Nom : Marien Joanny  
Adresse : disponible sur demande auprès de l’hébergeur, conformément à l’article 6-III-1 de la LCEN  
Email : voir ci-dessus  
Hébergeur :  
IONOS SARL  
7 place de la Gare – 57200 Sarreguemines – France  
Site : www.ionos.fr

💬 Acceptation  
En utilisant Legal ShuffleCam, vous reconnaissez avoir lu, compris et accepté l’intégralité des présentes règles. Tout manquement pourra entraîner une suppression immédiate de votre accès.

🪪 Version officielle française  
En cas de divergence entre cette version et toute traduction, la version française prévaut.

Dernière mise à jour : 10 novembre 2025

CGU · Mentions légales · Règlement
HTML

chmod 644 reglement.html

echo "📦 Ajout au dépôt Git..."
git add reglement.html

echo "📝 Commit..."
git commit -m "Mise à jour du règlement : consentement explicite et cadrage adulte"

echo "🚀 Push vers le dépôt distant..."
git push origin main

echo "✅ Règlement mis à jour, commit et push terminés."
