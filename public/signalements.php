<?php
/**
 * =========================================================================
 * NOTE IMPORTANTE : Système de Ban Préventif Automatisé (via Cron)
 * =========================================================================
 *
 * Ce fichier (signalements.php) est la PAGE DE VISUALISATION des rapports de modération.
 * IL NE CONTIENT PAS et NE DÉCLENCHE PAS la logique d'analyse et de ban IP.
 *
 * Le processus de ban est entièrement automatisé par des scripts shell exécutés
 * par le planificateur de tâches du système (Cron).
 *
 * 1. MÉCANISME DE BAN :
 * Le ban est effectué directement au niveau du noyau Linux via l'outil de pare-feu
 * système, **iptables**.
 * - La commande exécutée est : `/sbin/iptables -A INPUT -s <IP> -j DROP`.
 * - Ceci est un ban permanent (sauf si une règle de déban est appliquée), qui DROP
 * silencieusement tout le trafic entrant provenant de l'IP ciblée.
 * - Ce système est une logique personnalisée, il n'utilise PAS le service 'fail2ban'.
 *
 * 2. LOGIQUE DE DÉCLENCHEMENT (Exécutée par CRON) :
 * - scripts/review_processor.sh : Prépare les données de signalement pour l'analyse.
 * - scripts/ban_processor.sh  : Lit les données préparées et exécute
 * les commandes `iptables` pour bannir les adresses IP problématiques sur le serveur.
 *
 * 3. FRÉQUENCE :
 * - Le Cron est réglé pour s'exécuter à intervalle régulier (ex: toutes les 5 minutes).
 *
 * 4. LOCALISATION :
 * - Les scripts se trouvent dans le répertoire 'scripts/'.
 * - Les logs du système de ban se trouvent dans le répertoire 'data/' (ex: data/banned_ips.txt).
 *
 * En cas de bug ou de problème de ban, la première étape est de vérifier :
 * 1. Les logs de l'utilisateur (logs/...).
 * 2. L'exécution du Cron (journal du système).
 * 3. Les règles iptables actives sur le serveur.
 * 4. Les logs des scripts de ban (`data/banned_ips.txt`).
 *
 * NE PAS chercher la logique d'exécution du ban dans les fichiers PHP de l'interface.
 */

// /public/signalements.php
// Interface d'administration pour visualiser tous les rapports de modération.

// Définir le chemin vers le répertoire contenant les JSON de rapports.
// CHANGEMENT CLÉ ICI : Ajout de '/pending_review'
const REPORT_DIR = __DIR__ . '/../logs/reports/pending_review'; 

// Le chemin d'accès au dossier racine des images pour l'information de l'administrateur
const REPORT_IMAGES_PATH_INFO = '/var/www/legalshufflecam/logs/reports/images/'; 

// --- Fonction pour lire et décoder un fichier JSON de rapport ---
function getReportData($filename) {
    // Le chemin est maintenant dans 'pending_review' suite aux corrections de flux
    $filePath = REPORT_DIR . '/' . $filename; 
    // Vérification de sécurité: S'assurer que c'est bien un fichier JSON et qu'il est lisible
    if (pathinfo($filename, PATHINFO_EXTENSION) !== 'json' || !is_readable($filePath)) {
        return null;
    }
    $content = file_get_contents($filePath);
    return json_decode($content, true);
}

// --- Lire tous les fichiers de rapport ---
$reports = [];
// Tente de scanner le répertoire. Utilisation de @ pour éviter une erreur si le répertoire n'existe pas encore.
$files = @scandir(REPORT_DIR);

if ($files !== false) {
    // Filtrer les points '.' et '..' et traiter uniquement les fichiers JSON
    $reportFiles = array_filter($files, fn($f) => pathinfo($f, PATHINFO_EXTENSION) === 'json');
    
    // Trier par nom (les plus récents en premier si le timestamp est en tête de nom)
    rsort($reportFiles); 

    foreach ($reportFiles as $filename) {
        $data = getReportData($filename);
        if ($data) {
            $reports[] = $data;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚨 Historique des Signalements | LegalShuffleCam</title>
    <link rel="stylesheet" href="/css/style.css">
    <style>
        body { 
            background-color: #1c1c1c; 
            color: #ecf0f1; 
            padding: 20px; 
            font-family: Arial, sans-serif;
        }
        h1 { 
            color: #e74c3c; 
            border-bottom: 2px solid #e74c3c; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
        }
        .report-count { 
            font-size: 1.2em; 
            color: #f39c12; 
        }
        .report-item {
            border: 1px solid #34495e;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            background-color: #2c3e50;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            word-wrap: break-word; 
        }
        .report-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 10px;
        }
        .reported-id { 
            color: #f39c12; 
            font-weight: bold; 
            font-size: 1.1em; 
        }
        .reporter-id { 
            color: #bdc3c7; 
            font-size: 0.9em; 
        }
        .reason-tag { 
            background-color: #e74c3c; 
            color: white; 
            padding: 5px 10px; 
            border-radius: 4px; 
            font-weight: bold; 
            white-space: nowrap;
        }
        .ip-info { 
            font-size: 0.9em; 
            margin-top: 5px; 
            padding: 5px;
            border-left: 3px solid #3498db;
            background-color: #34495e;
        }
        .ip-reported { 
            color: #3498db; 
            font-weight: bold;
        }
        .ip-reporter { 
            color: #9b59b6; 
        }
        .image-preview { 
            margin-top: 10px; 
            max-width: 100%; 
            border: 1px solid #7f8c8d; 
            display: block; 
            height: auto;
        }
        .image-status-note {
             font-size: 0.85em; 
             color: #7f8c8d;
             margin-top: 5px;
             padding-top: 5px;
             border-top: 1px dashed #4a637d;
        }
        .scp-command-suggestion {
            background-color: #1a1a1a;
            color: #2ecc71; /* Vert pour l'action */
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
            font-family: monospace;
            white-space: pre-wrap;
            word-break: break-all;
            display: block;
        }
    </style>
</head>
<body>

    <h1>🚨 Historique des Signalements</h1>
    
    <p class="report-count">Total de **<?= count($reports) ?>** signalements enregistrés.</p>
    
    <?php if (empty($reports)): ?>
        <p>Aucun rapport trouvé dans le répertoire <code><?= REPORT_DIR ?></code>. Effectuez un signalement pour commencer à loguer les données.</p>
    <?php endif; ?>

    <?php foreach ($reports as $report): ?>
        <div class="report-item">
            <div class="report-header">
                <div>
                    <span class="reported-id">Signalé : <?= htmlspecialchars($report['reportedId'] ?? 'N/A') ?></span>
                    <br>
                    <span class="reporter-id">par : <?= htmlspecialchars($report['reporterId'] ?? 'N/A') ?></span>
                </div>
                <div class="reason-tag"><?= htmlspecialchars($report['reason'] ?? 'Raison Inconnue') ?></div>
            </div>

            <p class="ip-info">
                IP Signalé (Clé) : <span class="ip-reported"><?= htmlspecialchars($report['reportedIP'] ?? 'N/A') ?></span>
                <br>
                IP Signaleur : <span class="ip-reporter"><?= htmlspecialchars($report['reporterIP'] ?? 'N/A') ?></span>
            </p>

            <p>Heure : <strong><?= htmlspecialchars($report['timestamp'] ?? 'N/A') ?></strong></p>

            <?php 
            // ----------------------------------------------------------------------------------
            // Affichage de la capture d'écran (Uniquement pour l'information de l'administrateur)
            // ----------------------------------------------------------------------------------
            if (!empty($report['screenshotFile']) && $report['screenshotFile'] !== 'None' && $report['screenshotFile'] !== 'Failed to save screenshot'): 
            ?>
                <?php
                    // Chemin d'accès complet au fichier image réel sur le serveur
                    $image_full_server_path = REPORT_IMAGES_PATH_INFO . $report['screenshotFile'];
                ?>
                <p>Capture d'écran :</p>
                
                <p class="image-status-note">
                    *L'image est enregistrée hors du répertoire public. Pour la visualiser, utilisez SCP.
                </p>
                
                <span class="scp-command-suggestion">
                    SCP File: <?= htmlspecialchars($report['screenshotFile']) ?>
                    <br>
                    Chemin Serveur: <?= htmlspecialchars($image_full_server_path) ?>
                </span>
                
                <!-- Exemple de commande SCP (à exécuter depuis la machine locale de l'admin) -->
                <p class="image-status-note">
                    *Exemple de commande SCP à exécuter depuis votre machine :
                    <br>
                    <code>scp root@&lt;IP_DU_SERVEUR&gt;:<?= htmlspecialchars($image_full_server_path) ?> ~/Téléchargements/</code>
                </p>

            <?php else: ?>
                <p>Capture d'écran : Non disponible ou échec de l'enregistrement.</p>
            <?php endif; ?>

        </div>
    <?php endforeach; ?>

</body>
</html>