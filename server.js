const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3501;
const BUILDS_DIR = process.env.BUILDS_DIR || '/opt/frontend_builds';

// Load route -> build directory mappings
const routesFile = path.join(__dirname, 'routes.json');
const routes = JSON.parse(fs.readFileSync(routesFile, 'utf-8'));

// Health check
app.get('/server-health', (_req, res) => {
  res.json({
    success: true,
    message: 'JNAC frontend-server OK',
    port: PORT,
    routes: Object.keys(routes).length
  });
});

// Root: redirect to /survey-app/ (citizen survey landing for J-NAC)
app.get('/', (_req, res) => {
  res.redirect(302, '/survey-app/');
});

// Serve static files (JS / CSS / images / fonts) from EVERY build directory.
// Mount each build at BOTH the root (for Vite builds with base="/" referencing
// /assets/...) AND at its route prefix (for CRA builds with PUBLIC_URL=/<prefix>
// referencing /<prefix>/static/...). express.static returns next() on miss so
// fall-through is safe.
for (const [route, buildDir] of Object.entries(routes)) {
  const buildPath = path.join(BUILDS_DIR, buildDir);
  if (fs.existsSync(buildPath)) {
    app.use(route, express.static(buildPath));
    app.use(express.static(buildPath));
  }
}

// SPA route handlers: for each declared route prefix, send the build's index.html
for (const [route, buildDir] of Object.entries(routes)) {
  const buildPath = path.join(BUILDS_DIR, buildDir);

  app.get(route, (_req, res) => {
    const indexFile = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send(`Build not found: ${buildDir}`);
    }
  });

  app.get(`${route}/*`, (_req, res) => {
    const indexFile = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send(`Build not found: ${buildDir}`);
    }
  });
}

app.listen(PORT, () => {
  console.log(`JNAC frontend-server listening on port ${PORT}`);
  console.log(
    `Serving ${Object.keys(routes).length} routes from ${BUILDS_DIR}`
  );
});
