import { User, Role, Prisma } from '@prisma/client';
import { CreateSessionInput } from '../src/schema/session.schema';
import bcrypt from 'bcrypt';

jest.mock('../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    user: { 
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn()
    
    },
  },
}));

jest.mock('../src/service/user.service', () => {
    const originalModule = jest.requireActual('../src/service/user.service');
    return {
        ...originalModule,
        hashPassword: jest.fn((password: string) => Promise.resolve(`hashed_${password}`))
    }
})

import prisma from '../src/utils/prisma';
import { createUser, findUsers, getUserById, hashPassword, validateLogin } from '../src/service/user.service';

const actualHashPassword = jest.requireActual('../src/service/user.service').hashPassword;


describe('USER SERVICE', () => {
    describe('FUNCTION getUserById', () => {
        // @ts-ignore
        const findUniqueSpy = jest.spyOn(prisma.user, 'findUnique').mockImplementationOnce(() => {})
        
        it('should call findUnique', async () => {
            await getUserById(1);

            expect(findUniqueSpy).toHaveBeenCalled();
        });
    });

    describe('FUNCTION findUsers', () => {
        const findManySpy = jest.spyOn(prisma.user, 'findMany').mockImplementation();

        it('should call findMany', async () => {
            await findUsers({email: 'user@user.com'});

            expect(findManySpy).toHaveBeenCalled();
        });
    });

    describe('FUNCTION createUser', () => {
        const createSpy = jest.spyOn(prisma.user, 'create').mockImplementation();

        it ('should call create with a mocked hashed password', async () => {
            jest.spyOn(prisma.user, 'findMany').mockResolvedValueOnce([]);
            await createUser({
                email: 'test@test.com',
                password: 'test',
                phoneNumber: '1234567890',
                firstName: 'user',
                lastName: 'user',
            });

            expect(createSpy).toHaveBeenCalledWith({
                data: {
                    email: 'test@test.com',
                    password: 'hashed_test',
                    phoneNumber: '1234567890',
                    firstName: 'user',
                    lastName: 'user',
                }
            });
        });

        const DUPLICATE_EMAIL = 'duplicate@test.com';
        it('should identify duplicates and throw an error', async() => {
                jest.spyOn(prisma.user, 'findMany').mockResolvedValueOnce([
                    {id: 101, email: 'duplicate@test.com', password: 'hash'} as any
                ]);

                const duplicatePayload = {
                    email: DUPLICATE_EMAIL,
                    password: 'test',
                    phoneNumber: '1234567890',
                    firstName: 'new',
                    lastName: 'user'
                };

                await expect(createUser(duplicatePayload)).rejects.toThrow(
                    'User with this email already exists.'
                )

                expect(createSpy).not.toHaveBeenCalled();
            })
    });

    describe('FUNCTION validateLogin', () => {
        const password: string = 'password';
        let actualHashedPassword: string;
        let mockUser: User;

        beforeEach(async () => {
            actualHashedPassword = await actualHashPassword(password);

            mockUser = {
                id: 1,
                email: 'test@test.com',
                password: actualHashedPassword,
                phoneNumber: '1234567890',
                firstName: 'user',
                lastName: 'user',
                role: Role.user,
                createdAt: new Date(),
                updatedAt: new Date()
            } as User;

            jest.spyOn(bcrypt, 'compare').mockImplementation((plain, hash) => {
                return Promise.resolve(plain === password && hash === actualHashedPassword);
            });
        });
        
        
        describe('given valid login', () => {
            const login: CreateSessionInput['body'] = {
                email: 'test@test.com',
                password
            };

            const findManySpy = jest.spyOn(prisma.user, 'findMany').mockResolvedValueOnce([{
                id: 1,
                email: login.email!,
                password: actualHashedPassword,
                phoneNumber: '1234567890',
                firstName: 'user',
                lastName: 'user',
                role: Role.user,
                createdAt: new Date(),
                updatedAt: new Date()
            }]);

            it('should return the user', async () => {
                const user: User | null = await validateLogin(login);
                
                expect(typeof user).toBe('User');
            });
        });
    });

});