<?php
session_start();
$peerId = bin2hex(random_bytes(8));
$_SESSION['peer_id'] = $peerId;
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LegalShuffleCam - Chat Vidéo Aléatoire</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/dist/css/all.min.css">
    <style>
        :root { --primary: #007bff; --bg: #1a1a1a; --text: #ffffff; }
        body { margin: 0; font-family: sans-serif; background: var(--bg); color: var(--text); overflow: hidden; }
        .app-container { display: flex; flex-direction: column; height: 100vh; }
        .header { background: #222; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
        .main-content { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; background: #000; }
        .video-container { position: relative; background: #333; border-radius: 8px; overflow: hidden; aspect-ratio: 4/3; }
        video { width: 100%; height: 100%; object-fit: cover; }
        .controls { background: #222; padding: 1rem; display: flex; justify-content: center; gap: 1rem; }
        .control-btn { padding: 0.8rem 2rem; border: none; border-radius: 50px; cursor: pointer; font-weight: bold; font-size: 1.1rem; transition: all 0.3s; }
        .next { background: #28a745; color: white; }
        .next:hover { background: #218838; transform: scale(1.05); }
        .label { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
        #peer-id-display { font-family: monospace; font-size: 0.8rem; color: #888; }
    </style>
</head>
<body>
    <div class="app-container">
        <header class="header">
            <div class="logo">LegalShuffleCam</div>
            <div id="peer-id-display">ID: <?php echo $peerId; ?></div>
        </header>

        <main class="main-content">
            <div class="video-container" id="remote-container">
                <video id="remote-video" autoplay playsinline></video>
                <div class="label">Partenaire</div>
            </div>
            <div class="video-container" id="local-container">
                <video id="local-video" autoplay playsinline muted></video>
                <div class="label">Vous</div>
            </div>
        </main>

        <footer class="controls">
            <button id="next-btn" class="control-btn next">
                <i class="fas fa-forward"></i> Suivant
            </button>
        </footer>
    </div>

    <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
    <script src="js/tracking-min.js"></script>
    <script src="js/face-min.js"></script>
    <script src="js/facedetection.js"></script>
    <script src="js/match.js"></script>
</body>
</html>
