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

// CORRECTION IMPORTANTE DE SÉCURITÉ:
// Définir le chemin vers le répertoire des rapports hors de la zone publique.
// __DIR__ = /var/www/legalshufflecam/public
// __DIR__ . '/../logs/reports' = /var/www/legalshufflecam/logs/reports
const REPORT_DIR = __DIR__ . '/../logs/reports'; 

// --- Fonction pour lire et décoder un fichier JSON de rapport ---
function getReportData($filename) {
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
                // Note: Le handler a mis la base64_data dans une clé différente pour ne pas surcharger le log,
                // donc l'affichage brut de l'image ne fonctionnera que si la base64 a été passée dans le tableau
                // $reportData['imageBase64'], ce qui est absent de la version actuelle du handler pour des raisons de log/performance.
                
                // Si la donnée brute 'imageBase64' est présente dans le JSON (optionnel)
                if (!empty($report['imageBase64'])): 
            ?>
                <p>Capture d'écran :</p>
                <img src="<?= htmlspecialchars($report['imageBase64']) ?>" alt="Capture du signalé" class="image-preview">
            <?php 
                // Si le handler a enregistré qu'une capture est présente
                elseif (($report['imageBase64_data'] ?? '') === 'Present (base64)'): 
            ?>
                <p>Capture d'écran : **Présente** (dans le fichier JSON original), mais la donnée brute n'a pas été incluse dans cet affichage pour des raisons de performance.</p>
            <?php else: ?>
                <p>Capture d'écran : Non disponible.</p>
            <?php endif; ?>

        </div>
    <?php endforeach; ?>

</body>
</html>