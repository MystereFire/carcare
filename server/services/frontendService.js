const express = require('express');
const fs = require('fs');
const path = require('path');

function attachProductionFrontend(app, directory) {
  const indexPath = path.join(directory, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error('Interface non compilée. Lancez npm run build avant npm start.');
  app.use(express.static(directory, { index: false }));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !path.extname(req.path) && req.accepts('html')) return res.sendFile(indexPath);
    next();
  });
}

module.exports = { attachProductionFrontend };
