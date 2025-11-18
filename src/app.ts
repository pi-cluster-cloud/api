import express from 'express';
import config from 'config';
import router from './routes';
import createServer from './utils/create_server';

const PORT = config.get<number>('port');

const app = createServer();

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});