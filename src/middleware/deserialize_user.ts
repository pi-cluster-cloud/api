import {get} from 'lodash';
import {Request, Response, NextFunction} from 'express';
import { reissueAccessToken, verifyJwt, VerifyJwtResult } from '../service/session.service';

/**
 * Decodes a JsonWebToken and stores the information is `res.locals.user`
 * 
 * @async
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Function to call after completion
 * @returns Does not return a value, instead calls `next`
 */
export default async function deserializeUser(req: Request, res: Response, next: NextFunction): Promise<any> {
    const accessToken: string = get(req, 'headers.authorization', '')
    .replace(/^Bearer\s/, '');
    let refreshToken: string | string[] | undefined = get(req, 'headers.x-refresh');

    if (!accessToken) return next();
    if (Array.isArray(refreshToken)) {
        refreshToken = refreshToken[0];
    }
    
    const verified: VerifyJwtResult | null = verifyJwt(accessToken);
    if (!verified) {
        // Unable to verify JWT due to server error
        return res.status(500).send({
            message: 'Internal server error occured'
        });
    }

    const {isValid, decoded, expired} = verified;

    if (isValid) {
        res.locals.user = decoded;
        return next();
    }
    else if (expired && refreshToken) {
        const newAccessToken = await reissueAccessToken(refreshToken);
        
        if (newAccessToken) {
            res.setHeader('x-access-token', newAccessToken);
            res.locals.user = verifyJwt(newAccessToken)!.decoded;
        }
    }
    
    return next();
}