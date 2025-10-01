import express from 'express';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {Server} from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const _dirname = dirname(fileURLToPath(import.meta.url));
const html_file_str = "\\index.html"

app.get('/', (req, res) => {
    console.log(req.headers);
    res.sendFile(join(_dirname, html_file_str));
});

server.listen(3000, () => {
    console.log(`listening on port 3000`);
});