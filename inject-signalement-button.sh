#!/bin/bash

TARGET="public/index.php"

echo "🔧 Insertion du bouton de test dans $TARGET..."

if ! grep -q "simulateReportBtn" "$TARGET"; then
  sudo sed -i '/<\/body>/i \
<!-- 🧪 Bouton de test de signalement -->\n\
<button id="simulateReportBtn">📩 Simuler un signalement</button>\n\
<p id="status"></p>\n\
<script>\n\
document.getElementById("simulateReportBtn").addEventListener("click", () => {\n\
  fetch("/api/report", {\n\
    method: "POST",\n\
    headers: { "Content-Type": "application/json" },\n\
    body: JSON.stringify({\n\
      remoteId: "simu-browser",\n\
      reason: "test depuis navigateur",\n\
      image: "data:image/jpeg;base64,TESTBASE64",\n\
      reporterId: "admin",\n\
      sessionId: "session-browser",\n\
      ip: "127.0.0.1"\n\
    })\n\
  })\n\
  .then(res => {\n\
    const status = document.getElementById("status");\n\
    if (res.ok) {\n\
      status.textContent = "✅ Signalement simulé avec succès !";\n\
      status.style.color = "green";\n\
    } else {\n\
      status.textContent = "❌ Échec du signalement : " + res.status;\n\
      status.style.color = "red";\n\
    }\n\
  })\n\
  .catch(err => {\n\
    console.error("Erreur réseau :", err);\n\
    document.getElementById("status").textContent = "❌ Erreur réseau";\n\
  });\n\
});\n\
</script>' "$TARGET"

  echo "✅ Bouton injecté avec succès dans $TARGET"
else
  echo "⚠️  Le bouton semble déjà présent dans $TARGET"
fi
