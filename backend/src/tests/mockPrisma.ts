import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Export a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>();
