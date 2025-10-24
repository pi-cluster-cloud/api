import prisma from '../src/utils/prisma';
import * as userController from '../src/controller/user.controller';
import { Role } from '@prisma/client';
import * as userSchema from '../src/schema/user.schema';
import { omit } from 'lodash';

describe('USER CONTROLLER', () => {
    describe('FUNCTION createUserHandler', () => {
        it('should return 201 and created user without password', async () => {
            
        }