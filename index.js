const { program } = require('commander');
const http = require('http');

program
    .requiredOption('-h, --host <host>', 'server address')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <path>', 'path to cache directory');

program.parse(process.argv);

const options = program.opts();

// Check for required parameters
if (!options.host || !options.port || !options.cache) {
    console.error('Error: All parameters (--host, --port, --cache) are required.');
    process.exit(1);
}

// Create web server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Web server is running! Wow it is running while I am making those changes!!!');
});

// Start server
server.listen(options.port, options.host, () => {
    console.log(`Server started at http://${options.host}:${options.port}`);
});