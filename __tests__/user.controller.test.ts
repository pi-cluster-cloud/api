import prisma from '../src/utils/prisma';
import * as userController from '../src/controller/user.controller';
import { Role } from '@prisma/client';
import * as userSchema from '../src/schema/user.schema';
import { has, omit } from 'lodash';
import { hashPassword } from '../src/service/user.service';
//import { hashPassword } from '../src/service/user.service';



describe('USER CONTROLLER', () => {\
    // 201 Tests
    describe('FUNCTION createUserHandler', () => {
        it('should return 201 and created user without password', async () => {
            const login = {
                body: {
                    email: 'test@test.com'
                    , password: hashPassword
                    , firstName: 'Test'
                    , lastName: 'User'
                    , role: Role.user
                }};
                //expect (await userController.createUserHandler(String, hashPassword)).toBeDefined();
        }




// `201` Tests with the newly created user object on success
// `409` Tests if a unique constraint (phoneNumber, email) fails
// `400` Tests for other Prisma client errors
// `500` Tests for unknown errors