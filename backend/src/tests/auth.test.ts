import request from 'supertest';
import app from '../server';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock the prisma client
jest.mock('../config/prisma', () => {
  const { mockDeep } = require('jest-mock-extended');
  return {
    __esModule: true,
    default: mockDeep(),
  };
});

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      // Setup mock return value
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'CUSTOMER'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Registration successful');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should fail if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Existing User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('An account with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return a token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        role: 'CUSTOMER'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should return 401 for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        passwordHash: hashedPassword,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });
});
