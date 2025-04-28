const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const superagent = require('superagent');

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
      if (err.code === 'ENOENT') {
        try {
          const response = await superagent
            .get(`https://http.cat/${httpCode}.jpg`)
            .responseType('arraybuffer'); 

          const imageBuffer = Buffer.from(response.body);

          await fs.writeFile(cacheFilePath, imageBuffer);

          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(imageBuffer);
        } catch (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      }
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
  } else if (req.method === 'DELETE') {
    try {
      await fs.unlink(cacheFilePath);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Deleted');
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
});

async function startServer() {
  await ensureCacheDir();
  server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
  });
}

startServer();