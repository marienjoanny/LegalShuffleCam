#!/bin/bash

echo "🎯 Audit LegalShuffleCam : remoteVideo"

FILE="public/index-real.php"

if [ ! -f "$FILE" ]; then
  echo "❌ Fichier $FILE introuvable."
  exit 1
fi

echo "🔍 Recherche de <video id=\"remoteVideo\"> dans $FILE..."
grep -i 'video[^>]*id=["'"'"']remoteVideo' "$FILE" | head -n 1

echo ""
echo "🔍 Attributs HTML :"
grep -i 'video[^>]*id=["'"'"']remoteVideo' "$FILE" | grep -oE '(autoplay|playsinline|muted)'

echo ""
echo "🔍 Styles CSS associés :"
grep -i 'remoteVideo' public/css/*.css 2>/dev/null | grep -Ei '(display|visibility|opacity|z-index|width|height)' | head -n 10

echo ""
echo "📦 Résumé :"
echo "- ✅ Présence de remoteVideo : $(grep -qi 'video[^>]*id=["'"'"']remoteVideo' "$FILE" && echo oui || echo non)"
echo "- ✅ Attribut autoplay : $(grep -qi 'autoplay' "$FILE" && echo oui || echo non)"
echo "- ✅ Attribut playsinline : $(grep -qi 'playsinline' "$FILE" && echo oui || echo non)"
echo "- ✅ Attribut muted : $(grep -qi 'muted' "$FILE" && echo oui || echo non)"
echo "- ⚠️ Vérifie display/visibility/opacity/z-index dans CSS si la vidéo ne s’affiche pas."

echo ""
echo "🧠 Si la vidéo est masquée, injecte un style forcé dans rtc-core.js :"
echo "Object.assign(remoteVideo.style, { position:'fixed', top:'10px', left:'10px', width:'200px', height:'150px', zIndex:'9999', backgroundColor:'black' });"
