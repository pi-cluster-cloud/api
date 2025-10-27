import * as userController from '../src/controller/user.controller';
import * as userService from '../src/service/user.service';
import * as stringConversion from '../src/utils/string_conversion';
import { Role, Prisma, User } from '@prisma/client';
import { omit } from 'lodash';
import { Response, Request } from 'express';

// Use simple auto-mocking pattern. The functions in these modules are now jest.fn()s.
jest.mock('../src/service/user.service');
jest.mock('../src/utils/string_conversion');

const mockUser: User = { 
    id: 1,
    email: 'test@test.com',
    phoneNumber: '1234567890',
    password: 'hashedpassword123',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as Role,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockRes = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res;
};

describe('USER CONTROLLER', () => {
    describe('FUNCTION createUserHandler', () => {
        const mockReqBody = {
            email: 'newuser@test.com',
            password: 'mysecurepassword',
            firstName: 'New',
            lastName: 'User',
            phoneNumber: '0987654321',
            role: 'USER' as Role,
        };

        const mockReq = { body: mockReqBody } as unknown as Request;
        const res = mockRes();

        beforeEach(() => {
            jest.clearAllMocks();
            // Cast and mock imported function directly
            (userService.hashPassword as jest.Mock).mockResolvedValue('hashedpassword123');
        });

        it('should return 201 and created user without password on success 🎉', async () => {
            (userService.createUser as jest.Mock).mockResolvedValue(mockUser);

            await userController.createUserHandler(mockReq as any, res);

            expect(userService.hashPassword).toHaveBeenCalledWith(mockReqBody.password);
            expect(userService.createUser).toHaveBeenCalledWith({
                ...mockReqBody,
                password: 'hashedpassword123',
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith(omit(mockUser, 'password'));
        });

        it('should return 409 if a unique constraint (P2002) fails 🚫', async () => {
            const mockError = new Prisma.PrismaClientKnownRequestError(
                'Unique constraint failed on the fields: (`email`)',
                { code: 'P2002', clientVersion: '2.x.x', meta: { target: ['email'] } }
            );

            (userService.createUser as jest.Mock).mockRejectedValue(mockError);
            
            // FIX: Use the imported function's mock methods
            (stringConversion.snakeToCamelCase as jest.Mock).mockReturnValueOnce('email');

            await userController.createUserHandler(mockReq as any, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.send).toHaveBeenCalledWith({
                message: 'email already taken',
            });
        });

        it('should return 400 for other Prisma client errors', async () => {
            const mockError = new Prisma.PrismaClientKnownRequestError(
                'An operation failed because it depends on one or more records that were required but not found.',
                { code: 'P2025', clientVersion: '2.x.x' }
            );

            (userService.createUser as jest.Mock).mockRejectedValue(mockError);

            await userController.createUserHandler(mockReq as any, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                message: 'Database error occurred',
            });
        });

        it('should return 500 for unknown errors 🚨', async () => {
            const unknownError = new Error('Database connection failed');
            (userService.createUser as jest.Mock).mockRejectedValue(unknownError);

            await userController.createUserHandler(mockReq as any, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                message: 'Internal server error occured',
            });
        });
    });

    describe('FUNCTION getUserHandler', () => {
        const userId = 1;
        const mockReq = { params: { userId: String(userId) } } as unknown as Request;
        const res = mockRes();

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return 200 and the user without password on success ✨', async () => {
            (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

            await userController.getUserHandler(mockReq as any, res);

            expect(userService.getUserById).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(omit(mockUser, 'password'));
        });

        it('should return 404 if no user is found 🔍', async () => {
            (userService.getUserById as jest.Mock).mockResolvedValue(null);

            await userController.getUserHandler(mockReq as any, res);

            expect(userService.getUserById).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                message: 'User not found',
            });
        });

        it('should return 400 for Prisma client errors (e.g., invalid ID format)', async () => {
            const mockError = new Prisma.PrismaClientKnownRequestError(
                'The provided value for the column is not valid.',
                { code: 'P2000', clientVersion: '2.x.x' }
            );

            (userService.getUserById as jest.Mock).mockRejectedValue(mockError);

            await userController.getUserHandler(mockReq as any, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                message: 'Database error occured',
            });
        });

        it('should return 500 for unknown errors 💥', async () => {
            const unknownError = new Error('Some unexpected database error');
            (userService.getUserById as jest.Mock).mockRejectedValue(unknownError);

            await userController.getUserHandler(mockReq as any, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                message: 'Internal server error occured',
            });
        });
    });
});