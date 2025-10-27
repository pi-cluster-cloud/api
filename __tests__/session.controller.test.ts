import { Response } from 'express';
import { TypedRequest } from '../src/utils/typed_request';
import { CreateSessionInput } from '../src/schema/session.schema';
import * as sessionController from '../src/controller/session.controller';
import * as sessionService from '../src/service/session.service';
import * as userService from '../src/service/user.service';
import { Session, User, Role } from '@prisma/client';
import config from 'config';
import { Algorithm } from 'jsonwebtoken';

// Mock dependencies
jest.mock('config');
jest.mock('../src/service/session.service');
jest.mock('../src/service/user.service');

// --- Mock Data ---

const mockLoginBody: CreateSessionInput['body'] = {
    email: 'user@example.com',
    password: 'Password123',
};

const mockSession: Session = {
    id: 100,
    user: 1, // Controller uses newSession.user, so this property must exist.
    valid: true,
    userAgent: 'test-agent',
    createdAt: new Date(),
    updatedAt: new Date(),
} as any; 

const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    phoneNumber: '1234567890',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as Role,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockRequest = (body: any, userAgent: string | undefined): TypedRequest<CreateSessionInput> => 
    ({ 
        body, 
        headers: { 'user-agent': userAgent } 
    } as unknown as TypedRequest<CreateSessionInput>);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res;
};

// --- Test Suite ---

describe('SESSION CONTROLLER', () => {
    describe('FUNCTION createSessionHandler', () => {
        const req = mockRequest(mockLoginBody, 'TestAgent/1.0');
        const res = mockResponse();

        beforeEach(() => {
            jest.clearAllMocks();
            
            // Simplified config mocking
            (config.get as jest.Mock).mockImplementation((key: string) => {
                if (key === 'jwtAlgorithm') return 'HS256';
                if (key === 'accessTokenTtl') return '1h';
                return null;
            });
        });

        it('should return 201 and the access token on successful login ✨', async () => {
            // ARRANGE
            (sessionService.createSession as jest.Mock).mockResolvedValue(mockSession);
            (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);
            (sessionService.signJWT as jest.Mock).mockReturnValue('mockAccessToken123');

            // ACT
            await sessionController.createSessionHandler(req, res);

            // ASSERT
            expect(sessionService.createSession).toHaveBeenCalledWith(
                mockLoginBody,
                'TestAgent/1.0'
            );
            // ASSERT: Verify call uses .user
            expect(userService.getUserById).toHaveBeenCalledWith(mockSession.user);
            expect(sessionService.signJWT).toHaveBeenCalledWith(
                {
                    // ASSERT: Verify payload uses .user
                    user: mockSession.user, 
                    session: mockSession.id,
                    role: mockUser.role,
                },
                expect.objectContaining({
                    algorithm: 'HS256', 
                })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith('mockAccessToken123');
        });

        it('should return 401 if login fails (createSession returns null) 🚫', async () => {
            // ARRANGE
            (sessionService.createSession as jest.Mock).mockResolvedValue(null);

            // ACT
            await sessionController.createSessionHandler(req, res);

            // ASSERT
            expect(sessionService.createSession).toHaveBeenCalled();
            expect(userService.getUserById).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                message: 'Invalid login',
            });
        });

        it('should return 500 if signJWT fails (returns null) 🚨', async () => {
            // ARRANGE
            (sessionService.createSession as jest.Mock).mockResolvedValue(mockSession);
            (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);
            (sessionService.signJWT as jest.Mock).mockReturnValue(null);

            // ACT
            await sessionController.createSessionHandler(req, res);

            // ASSERT
            expect(sessionService.createSession).toHaveBeenCalled();
            expect(sessionService.signJWT).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                message: 'Internal server error occured',
            });
        });
    });
});