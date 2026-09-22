import request from 'supertest';
import app from '../server';
import prisma from '../config/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../config/prisma', () => {
  const { mockDeep } = require('jest-mock-extended');
  return {
    __esModule: true,
    default: mockDeep(),
  };
});

describe('Ticket API', () => {
  let customerToken: string;
  let agentToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';

    // Generate fake tokens for testing authorization
    customerToken = jwt.sign({ userId: 1, role: 'CUSTOMER' }, 'test_secret');
    agentToken = jwt.sign({ userId: 2, role: 'AGENT' }, 'test_secret');
  });

  describe('GET /api/tickets', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/tickets');
      expect(res.status).toBe(401);
    });

    it('should fetch only customer tickets if role is CUSTOMER', async () => {
      (prisma.ticket.findMany as jest.Mock).mockResolvedValue([
        { id: 1, subject: 'Customer Ticket', customerId: 1 }
      ]);

      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 1 }
        })
      );
    });

    it('should fetch all tickets if role is AGENT', async () => {
      (prisma.ticket.findMany as jest.Mock).mockResolvedValue([
        { id: 1, subject: 'Customer Ticket', customerId: 1 },
        { id: 2, subject: 'Another Ticket', customerId: 3 }
      ]);

      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      // Ensure no WHERE clause is passed restricting to customerId
      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}
        })
      );
    });
  });

  describe('POST /api/tickets', () => {
    it('should allow customer to create a ticket', async () => {
      (prisma.ticket.create as jest.Mock).mockResolvedValue({
        id: 1,
        subject: 'New Ticket',
        description: 'Test description',
        customerId: 1
      });

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subject: 'New Ticket',
          description: 'Test description',
          priority: 'HIGH'
        });

      expect(res.status).toBe(201);
      expect(res.body.subject).toBe('New Ticket');
    });
  });

  describe('PUT /api/tickets/:id (Agent Only)', () => {
    it('should block customers from updating tickets', async () => {
      const res = await request(app)
        .put('/api/tickets/1')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: You do not have the required permissions');
    });

    it('should allow agents to update tickets', async () => {
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.ticket.update as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'RESOLVED'
      });

      const res = await request(app)
        .put('/api/tickets/1')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'RESOLVED' }
        })
      );
    });
  });
});
