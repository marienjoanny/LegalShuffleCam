#!/bin/bash

echo "🔧 Application du patch RTC via diff + vérification socket.emit"
echo "------------------------------------------------------------"

# Fichiers
TARGET="public/js/rtc-core.js"
PATCHFILE="rtc-core.patch.fixed"
SERVER="server.js"

# 1. Créer le patch corrigé
cat << 'DIFF' > $PATCHFILE
--- public/js/rtc-core.js.old
+++ public/js/rtc-core.js
@@ -10,6 +10,8 @@
 let localStream = null;
 let peerConnection = null;
 let remoteId = null;
+let iceBuffer = [];
+let partnerSocketId = null;
 let socket = null;
 window.lastRTCPartnerId = null;

@@ -20,6 +22,24 @@
   }
 };

+/**
+ * Envoie un candidat ICE au partenaire.
+ */
+function sendIce(candidate) {
+  if (partnerSocketId) {
+    socket.emit("ice-candidate", { to: partnerSocketId, candidate });
+  } else {
+    iceBuffer.push(candidate);
+  }
+}
+
+function flushIceBuffer() {
+  if (partnerSocketId && iceBuffer.length > 0) {
+    console.log(`[RTC] 🔁 ICE buffer vidé (${iceBuffer.length} candidats).`);
+    iceBuffer.forEach(c => socket.emit("ice-candidate", { to: partnerSocketId, candidate: c }));
+    iceBuffer = [];
+  }
+}
+
 // --- Fonctions principales ---
 /**
  * Initialise le flux local.
@@ -50,7 +70,7 @@
   pc.onicecandidate = (event) => {
     if (event.candidate) {
       console.log(`[RTC] ICE candidat généré.`);
-      socket.emit("ice-candidate", { to: remoteId, candidate: event.candidate });
+      sendIce(event.candidate);
     }
   };

@@ -90,6 +110,8 @@
     remoteId = partnerId;
     window.lastRTCPartnerId = partnerId;
     peerConnection = createPeerConnection(localStream);
+    partnerSocketId = partnerId;
+    flushIceBuffer();
     const offer = await peerConnection.createOffer();
     // ...
@@ -120,6 +142,8 @@
     remoteId = data.from;
     window.lastRTCPartnerId = data.from;
     peerConnection = createPeerConnection(localStream);
+    partnerSocketId = data.from;
+    flushIceBuffer();
     await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
     // ...
@@ -150,7 +174,13 @@
   socket = io();
   socket.on("connect", () => {
     console.log(`[SOCKET] Connecté (id: ${socket.id}).`);
+  });
+
+  socket.on("partner", (data) => {
+    if (data.id) {
+      partnerSocketId = data.id;
+      flushIceBuffer();
+    }
   });
DIFF

# 2. Sauvegarde et application du patch
echo "📦 Sauvegarde de $TARGET → $TARGET.old"
cp "$TARGET" "$TARGET.old"

echo "📦 Application du patch avec 'patch'"
patch "$TARGET" < "$PATCHFILE"

# 3. Vérification socket.emit("partner") dans server.js
echo "🔍 Vérification de socket.emit(\"partner\") dans $SERVER..."
if grep -q 'socket.emit("partner"' "$SERVER"; then
  echo "✅ socket.emit(\"partner\") déjà présent dans $SERVER"
else
  echo "⚠️ socket.emit(\"partner\") absent. Tu dois l’ajouter après le pairing."
fi

echo "✅ Script terminé."
