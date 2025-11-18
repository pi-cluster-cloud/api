import express from 'express';
import config from 'config';
import router from './routes';
import deserializeUser from './middleware/deserialize_user';

const PORT = config.get<number>('port');

const app = express();
app.use(express.json());
app.use(deserializeUser);

app.use('/api', router);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});