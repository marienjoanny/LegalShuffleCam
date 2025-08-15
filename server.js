const express = require('express');
const app = express();

// Fichiers statiques
app.use(express.static('public'));

// Healthcheck
app.get('/healthz', (_req, res) => res.type('text/plain').send('OK'));

// (Ajoute ici tes routes HTTP si besoin, mais pas de listen)
module.exports = app;
