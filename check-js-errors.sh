#!/bin/bash

echo "🔍 Scan des erreurs JavaScript dans public/*.js et public/*.php..."

grep -Ern 'Uncaught (SyntaxError|ReferenceError|TypeError)' public/*.js public/*.php | tee /tmp/js-errors.log

if [ -s /tmp/js-errors.log ]; then
  echo "❌ Erreurs détectées. Voir /tmp/js-errors.log pour les détails."
else
  echo "✅ Aucun message d'erreur JavaScript trouvé dans les fichiers sources."
fi
