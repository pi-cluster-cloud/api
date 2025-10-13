import {z} from 'zod';
import { zPhoneNumber } from './user.schema';
import { omit } from 'lodash';

export const createSessionSchema = z.object({
    body: z.object({
        email: z.email({
            error: 'Invalid email'
        }).optional(),
        phoneNumber: zPhoneNumber.optional(),
        password: z.string('Password is required')
    })
    .refine((data) => data.email || data.phoneNumber, {
        // Either email or phone number required
        error: 'Email or phone number is required',
        path: ['email, phoneNumber']
    })
    .transform((data) => {
        // If both email and phoneNumber, remove phoneNumber
        if (data.email && data.phoneNumber) {
            return omit(data, 'phoneNumber');
        }
        return data;
    }),
    params: z.any(),
    query: z.any()
});


export type CreateSessionInput = z.infer<typeof createSessionSchema>;