const { onRequest } = require('firebase-functions/v2/https');
const { default: next } = require('next');
const server = next({ dev: false, conf: { distDir: '.next' } });
const handle = server.getRequestHandler();

exports.nextjsServer = onRequest((req, res) => {
  return server.prepare().then(() => handle(req, res));
});
