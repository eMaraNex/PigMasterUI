import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer(async (req, res) => {
    try {
        const parsedUrl = parse(req.url || '', true);
        await handle(req, res, parsedUrl);
    } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal server error');
    }
});

server.listen(port, () => {
    console.log(`Ready on http://${process.env.HOSTNAME || 'localhost'}:${port}`);
});