import express from 'express';
import config from 'config';
import router from './routes';
<<<<<<< HEAD
import deserializeUser from './middleware/deserialize_user';

const PORT = config.get<number>('port');

const app = express();
app.use(express.json());
app.use(deserializeUser);

app.use('/api', router);
=======
import createServer from './utils/create_server';

const PORT = config.get<number>('port');

const app = createServer();
>>>>>>> feature/0.1.0-unit-tests

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});