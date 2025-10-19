import { User, Role, Prisma } from '@prisma/client';
import { CreateSessionInput } from '../src/schema/session.schema';

jest.mock('../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    user: { findMany: jest.fn() },
  },
}));
import prisma from '../src/utils/prisma';
import { createUser, findUsers, getUserById, hashPassword, validateLogin } from '../src/service/user.service';

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

        it ('should call create', async () => {
            await createUser({
                email: 'test@test.com',
                password: 'test',
                phoneNumber: '1234567890',
                firstName: 'user',
                lastName: 'user',
            });

            expect(createSpy).toHaveBeenCalled();
        });
    });

    describe('FUNCTION validateLogin', () => {
        const password: string = 'password';
        let hashedPassword: string;

        beforeEach(async () => {
            hashedPassword = await hashPassword(password);
        });
        
        
        describe('given valid login', () => {
            const login: CreateSessionInput['body'] = {
                email: 'test@test.com',
                password
            };

            const findManySpy = jest.spyOn(prisma.user, 'findMany').mockResolvedValueOnce([{
                id: 1,
                email: login.email!,
                password: hashedPassword,
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