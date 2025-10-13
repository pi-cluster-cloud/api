import {Request, Response, NextFunction} from 'express';
import {ZodObject} from 'zod';

function validateResource(schema: ZodObject) {
    return function (req: Request, res: Response, next: NextFunction) {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });
            // Request passed validation, proceed
            return next();
        }
        catch (e: any) {
            // Request failed validation
            return res.status(400).send(e.issues);
        }
    };
}

export default validateResource;
