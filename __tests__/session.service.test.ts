import { CreateSessionInput } from '../src/schema/session.schema';
import prisma from '../src/utils/prisma';
import { Role, Session } from '@prisma/client';

import * as sessionService from '../src/service/session.service';
import { hashPassword } from '../src/service/user.service';

describe('SESSION SERVICE', () => {
    describe('FUNCTION createSession', () => {
        // ARRANGE
        const plainTextPassword: string = 'password';
        let hashedPassword: string;

        beforeAll(async () => {
            hashedPassword = await hashPassword(plainTextPassword);

            jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
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

        const createSpy = jest.spyOn(prisma.session, 'create').mockResolvedValue({
            id: 1,
            user: 1,
            userClient: null,
            isValid: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        describe('given valid login', () => {
            // ARRANGE
            const login: CreateSessionInput['body'] = {
                email: 'test@test.com',
                password: plainTextPassword
            };

            it('should call create', async () => {
                // ACT
                await sessionService.createSession(login);

                // ASSERT
                expect(createSpy).toHaveBeenCalled();
            });

            it('should return the session', async () => {
                const session: Session | null = await sessionService.createSession(login);

                expect(typeof session).toBe('object');
            });
        });

        describe('given invalid login', () => {
            // ARRANGE
            const login: CreateSessionInput['body'] = {
                email: 'fakeemail@test.com',
                password: plainTextPassword
            };

            it('should NOT call create', async () => {
                // ACT
                await sessionService.createSession(login);

                // ASSERT
                expect(createSpy).not.toHaveBeenCalled();
            });

            it('should return null', async () => {
                // ACT
                const session: Session | null = await sessionService.createSession(login);

                // ASSERT
                expect(session).toBeNull();
            });
        });
    });
});