import * as sessionService from '../src/service/session.service';
import * as userService from '../src/service/user.service';
import { Role, Prisma } from '@prisma/client';
import supertest from 'supertest';
import createServer from '../src/utils/create_server';
import { CreateSessionInput } from '../src/schema/session.schema';

const app = createServer();

describe('SESSION CONTROLLER', () => {
    describe('ROUTE POST /api/sessions', () => {
        // ARRANGE
        const ENDPOINT: string = '/api/sessions';
        const sessionInput: CreateSessionInput['body'] = {
            email: 'test@test.com',
            password: 'password',
        };

        describe('given a valid login', () => {
            // ARRANGE
            jest.spyOn(userService, 'getUserById').mockResolvedValueOnce({
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
            beforeEach(() => {
                jest.spyOn(sessionService, 'createSession').mockResolvedValue({
                    id: 1,
                    user: 1,
                    isValid: true,
                    userClient: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            });

            it('should return status 201 with an access token', async () => {
                // ACT
                const result = (await supertest(app).post(ENDPOINT).send(sessionInput));

                // ASSERT
                expect(result.statusCode).toBe(201);
                expect(typeof result.text).toBe('string'); // Change to body when refresh tokens added
            });
        });
        describe('given an invalid login', () => {
            beforeEach(() => {
                jest.spyOn(sessionService, 'createSession').mockResolvedValue(null);
            });

            it('should return status 401', async () => {
                // ACT
                const result: number = (await supertest(app).post(ENDPOINT).send(sessionInput))
                .statusCode;

                // ASSERT
                expect(result).toBe(401);
            });
        });
    });
});