import config from 'config';
import { CreateSessionInput } from '../schema/session.schema';
import { CreateUserInput, SearchUsersInput } from '../schema/user.schema';
import prisma from '../utils/prisma';
import {Prisma, User} from '@prisma/client';
import bcrypt from 'bcrypt';
import { omit } from 'lodash';

/**
 * Finds all users of given format matching given properties
 * 
 * @async
 * @param {Primsa.UserSelect} select - Properties of the user to select (optional, defaults to all properties)
 * @param {Prisma.UserWhereUniqueInput} where - Properties to search for
 * @returns {Promise<Partial<User>[]>} - Found users reduced to only fields in where
 */
export async function findUsers(
    {
        select = {
            id: true,
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
        where
    }: {
        select?: Prisma.UserSelect;
        where: SearchUsersInput['query'] | Prisma.UserWhereUniqueInput;
    }
): Promise<Partial<User>[]> {
    if (where.id) {
        where.id = Number(where.id); // Ensure id is number
    }
    const users: Partial<User>[] = await prisma.user.findMany({
        select,
        where: where as Prisma.UserWhereUniqueInput
    });
    return users;
}

/**
 * Gets a user given their `id`.
 *
 * @async
 * @param {number} userId - The `id` of the user to be retrieved.
 * @param {Prisma.UserSelect} select - Properties of the user to select (optional, defaults to all fields).
 * @returns {Promise<Partial<User> | null>} The found user or `null` if no user exists.
 */
export async function getUserById({
    userId,
    select = {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
    }
}: {
    userId: number,
    select?: Prisma.UserSelect
}
    
): Promise<Partial<User> | null> {
    const user: User | null = await prisma.user.findUnique({
        select,
        where: {id: userId}
    });

    return user;
}

/**
 * Creates a user given validated creation data
 * 
 * @async
 * @param userData {Prisma.UserCreateInput} - Validated user creation data
 * @returns {Promise<User>} - Created user
 * 
 * @throws {PrismaClientKnownRequestError} - if unique constraint (email, password) fails
 */
export async function createUser(
    userData: CreateUserInput['body'] | Prisma.UserCreateInput
): Promise<User> {
    const user: User = await prisma.user.create({data: userData});
    return user;
}

/**
 * Hashes a password
 * 
 * @async
 * @param password {string} - Plaintext password to be hashed
 * @returns {string} - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    const salt: string = await bcrypt.genSalt(config.get<number>('saltRounds'));
    const hashedPassword: string = await bcrypt.hash(password, salt);

    return hashedPassword;
}

/**
 * Validates an email/phone password combination
 * 
 * @async
 * @param {CreateSessionInput['body']} loginData - Login data containing (`email` OR `phoneNumber`) and `password`
 * @returns {Promise<Partial<User> | null>} - The User is login is valid, otherwise returns `null`
 */
export async function validateLogin(
    loginData: CreateSessionInput['body']
): Promise<Partial<User> | null> {
    const users: Partial<User>[] = await findUsers({
        select: {id: true, password: true},
        where: omit(loginData, 'password')
    });
    if (!users.length) return null;

    for (const user of users) {
        if (await bcrypt.compare(loginData.password, user.password as string)) {
            return omit(user, 'password');
        }
    }
    return null;
}