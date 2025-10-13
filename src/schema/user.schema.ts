import {z} from 'zod';
import { parsePhoneNumberFromString, PhoneNumber } from 'libphonenumber-js';
import { stringToTitleCase } from '../utils/string_conversion';

export const zPhoneNumber = z.string()
    .max(15, {
        error: 'Phone number too long'
    })
    .min(3, {
        error: 'Phone number too short'
    })
    .transform((arg, ctx) => {
        const phone: PhoneNumber | undefined = parsePhoneNumberFromString(arg, {
            defaultCountry: 'US', // Default country is no country code
            extract: false, // Entire string must be valid number
        });

        // Valid number
        if (phone && phone.isValid()) {
            return phone.number;
        }

        // Invalid number
        ctx.addIssue({
            code: 'custom',
            message: 'Invalid phone number',
        });
        return z.NEVER; // Fail validation
    });

export const createUserSchema = z.object({
    body: z.object({
        email: z.email({
            error: (issue) => {
                if (issue.input === undefined) {
                    return "Email is required";
                }
                return "Invalid email";
            }
        })
            .min(5, {
                error: 'Email too short'
            })
            .max(320, {
                message: 'Email too long'
            }),
        phoneNumber: zPhoneNumber.optional(),
        password: z.string('Password is required')
            .min(8, {
                error: 'Password too short'
            })
            .max(255, {
                error: 'Password too long'
            }),
        firstName: z.string('First name is required')
            .min(2, {
                error: 'First name too short'
            })
            .max(30, {
                error: 'First name too long'
            })
            .transform((data) => stringToTitleCase(data)),
        lastName: z.string('Last name is required')
            .min(2, {
                error: 'Last name too short'
            })
            .max(30, {
                error: 'Last name too long'
            })
            .transform((data) => stringToTitleCase(data))
    }).strict(),
    params: z.any(),
    query: z.any()
});

export const getUserSchema = z.object({
    params: z.object({
        userId: z.string('userId is required')
        .refine((data) => Number.isInteger(Number(data)) && Number(data) > 0, {
            error: 'userId must be a positive integer'
        })
    }).strict(),
    body: z.any(),
    query: z.any()
});

export const searchUsersSchema = z.object({
    query: z.object({
        id: z.string()
        .refine((data) => Number.isInteger(Number(data)) && Number(data) > 0, {
            error: 'userId must be a positive integer'
        })
        .optional(),
        email: z.email('Invalid email')
            .min(5, {
                error: 'Email too short'
            })
            .max(320, {
                message: 'Email too long'
            })
            .optional(),
        phoneNumber: zPhoneNumber.optional(),
        firstName: z.string('First name is required')
            .min(2, {
                error: 'First name too short'
            })
            .max(30, {
                error: 'First name too long'
            })
            .transform((data) => stringToTitleCase(data))
            .optional(),
        lastName: z.string('Last name is required')
            .min(2, {
                error: 'Last name too short'
            })
            .max(30, {
                error: 'Last name too long'
            })
            .transform((data) => stringToTitleCase(data))
            .optional()
    }).strict()
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type GetUserInput = z.infer<typeof getUserSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;