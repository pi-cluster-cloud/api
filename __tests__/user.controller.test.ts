import * as userService from '../src/service/user.service';
import { Role, Prisma } from '@prisma/client';
import supertest from 'supertest';
import { CreateUserInput } from '../src/schema/user.schema';
import createServer from '../src/utils/create_server';

const app = createServer();

describe('USER CONTROLLER', () => {
    describe('ROUTE POST /api/users', () => {
        // ARRANGE
        const ENDPOINT: string = '/api/users';
        const userInput: CreateUserInput['body'] = {
            email: 'test@test.com',
            password: 'password',
            firstName: 'test',
            lastName: 'test',
        };

        describe('given unique email and/or phoneNumber', () => {
            // ARRANGE
            let createUserSpy: jest.SpyInstance;
            beforeEach(() => {
                createUserSpy = jest.spyOn(userService, 'createUser').mockResolvedValue({
                    ...userInput,
                    id: 1,
                    phoneNumber: null,
                    role: Role.user,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            });

            it('should return status 201', async () => {
                // ACT
                const result: number = (await supertest(app).post(ENDPOINT).send(userInput))
                .statusCode;

                // ASSERT
                expect(result).toBe(201);
            });
        });
        describe('given a duplicate email and/or phoneNumber', () => {
            let createUserSpy: jest.SpyInstance;
            beforeEach(() => {
                createUserSpy = jest.spyOn(userService, 'createUser').mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
                    '',
                    {
                        code: 'P2002',
                        meta: {target: ['email']},
                        clientVersion: '',
                    }
                ));
            }); 
            
            it('should return status 409', async () => {
                // ACT
                const result: number = (await supertest(app).post(ENDPOINT).send(userInput))
                .statusCode;

                // ASSERT
                expect(result).toBe(409);
            });
        });
    });
    describe('ROUTE GET /api/users/:userId', () => {
        const ENDPOINT = (userId: string): string => `/api/users/${userId}`;

        describe('given an existing userId', () => {
            // ARRANGE
            let getUserByIdSpy: jest.SpyInstance;
            beforeEach(() => {
                getUserByIdSpy = jest.spyOn(userService, 'getUserById').mockResolvedValueOnce({
                    email: 'test@test.com',
                    password: 'password',
                    firstName: 'test',
                    lastName: 'test',
                    id: 1,
                    phoneNumber: null,
                    role: Role.user,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            });

            it('should return status 200', async () => {
                // ACT
                const result: number = (await supertest(app).get(ENDPOINT('1')))
                .statusCode;

                // ASSERT
                expect(result).toBe(200);
            });
        });
        describe('given a nonexistent userId', () => {
            // ARRANGE
            let getUserByIdSpy: jest.SpyInstance;
            beforeEach(() => {
                getUserByIdSpy = jest.spyOn(userService, 'getUserById').mockResolvedValueOnce(null);
            });

            it('should return status 404', async () => {
                // ACT
                const result: number = (await supertest(app).get(ENDPOINT('1')))
                .statusCode;

                // ASSERT
                expect(result).toBe(404);
            });
        });
    });
});