const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cache>', 'Cache directory')
  .parse(process.argv);

const options = program.opts();

async function ensureCacheDir() {
  try {
    await fs.mkdir(options.cache, { recursive: true });
  } catch (err) {
    console.error('Error creating cache directory:', err);
    process.exit(1);
  }
}

const server = http.createServer(async (req, res) => {
  const httpCode = req.url.slice(1);
  const cacheFilePath = path.join(options.cache, `${httpCode}.jpg`);

  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(cacheFilePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } else if (req.method === 'PUT') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      try {
        await fs.writeFile(cacheFilePath, buffer);
        res.writeHead(201, { 'Content-Type': 'text/plain' });
        res.end('Created');
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from proxy server!');
  }
});

async function startServer() {
  await ensureCacheDir();
  server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
  });
}

startServer();