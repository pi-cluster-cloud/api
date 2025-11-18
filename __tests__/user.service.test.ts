import { User, Role } from '@prisma/client';
import { CreateSessionInput } from '../src/schema/session.schema';
import prisma from '../src/utils/prisma';
import * as userService from '../src/service/user.service';

describe('USER SERVICE', () => {
    describe('FUNCTION getUserById', () => {
        // ARRANGE
        const findUniqueSpy = jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
            id: 1,
            email: 'test@test.com',
            phoneNumber: null,
            role: Role.user,
            password: 'password',
            firstName: 'test',
            lastName: 'test',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        it('should call findUnique', async () => {
            // ACT
            await userService.getUserById(1);

            // ASSERT
            expect(findUniqueSpy).toHaveBeenCalled();
        });
    });

    describe('FUNCTION findUsers', () => {
        const findManySpy = jest.spyOn(prisma.user, 'findMany').mockResolvedValueOnce([]);

        it('should call findMany', async () => {
            await userService.findUsers({email: 'test@test.com'});

            expect(findManySpy).toHaveBeenCalled();
        });
    });

    describe('FUNCTION createUser', () => {
        it('should call create', async () => {
            // ARRANGE
            const createSpy = jest.spyOn(prisma.user, 'create').mockResolvedValueOnce({
                id: 1,
                email: 'test@test.com',
                phoneNumber: null,
                role: Role.user,
                password: 'password',
                firstName: 'test',
                lastName: 'test',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // ACT
            await userService.createUser({
                email: 'test@test.com',
                phoneNumber: null,
                role: Role.user,
                password: 'password',
                firstName: 'test',
                lastName: 'test',
            });

            // ASSERT
            expect(createSpy).toHaveBeenCalled();
        });
    });

    describe('FUNCTION validateLogin', () => {
        // ARRANGE
        const plainTextPassword: string = 'password';
        let hashedPassword: string;
        let findUniqueSpy: jest.SpyInstance;

        beforeAll(async () => {
            hashedPassword = await userService.hashPassword(plainTextPassword);

            findUniqueSpy = jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
                id: 1,
                email: 'test@test.com',
                phoneNumber: null,
                role: Role.user,
                password: hashedPassword,
                firstName: 'test',
                lastName: 'test',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });
        
        it('should call findUnique', async () => {
            // ARRANGE
            const login: CreateSessionInput['body'] = {
                email: 'test@test.com',
                password: plainTextPassword
            };

            // ACT
            await userService.validateLogin(login);

            // ASSERT
            expect(findUniqueSpy).toHaveBeenCalled;
        });

        describe('given valid email and password', () => {
            // ARRANGE
            const login: CreateSessionInput['body'] = {
                email: 'test@test.com',
                password: plainTextPassword
            };

            it('should return the user', async () => {
                // ACT
                const user: User | null = await userService.validateLogin(login);
                
                // ASSERT
                expect(typeof user).toBe('object');
            });
        });

        describe('given valid email and invalid password', () => {
            // ARRANGE
            const login: CreateSessionInput['body'] = {
                email: 'test@test.com',
                password: plainTextPassword
            };
            
            it('should return null', async () => {
                // ACT
                const user: User | null = await userService.validateLogin(login);

                // ASSERT
                expect(user).toBeNull();
            });
        });

        describe('given invalid email', () => {
            // ARRANGE
            const login: CreateSessionInput['body'] = {
                email: 'fakeemail@test.com',
                password: plainTextPassword
            };
            jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

            it('should return null', async () => {
                // ACT
                const user: User | null = await userService.validateLogin(login);

                // ASSERT
                expect(user).toBeNull();
            });
        });
    });
});