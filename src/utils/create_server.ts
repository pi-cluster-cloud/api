import express, {Express} from 'express';
import deserializeUser from '../middleware/deserialize_user';
import routes from '../routes';
import router from '../routes';

export default function createServer() {
    const app: Express = express();
    app.use(express.json());
    app.use('/api', deserializeUser);
    app.use('/api', router);

    return app;
}