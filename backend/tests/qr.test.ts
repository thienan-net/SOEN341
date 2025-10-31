// backend/tests/qr.test.ts
import request from 'supertest';
import express from 'express';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import ticketsRouter from '../src/routes/tickets';
import TicketModel from '../src/models/Ticket';
import EventModel from '../src/models/Event';
import '../src/models/User';
import '../src/models/Organization';

jest.mock('../src/middleware/auth', () => {
  const { Types } = require('mongoose');
  const base = (req: any, _res: any, next: any) => {
    req.user = {
      _id: new Types.ObjectId(),
      roles: ['organizer'],
      organization: (global as any).__TEST_ORG__,
    };
    next();
  };
  const authorize = (_role: string) => base;
  return {
    __esModule: true,
    default: base,
    authenticate: base,
    authorize,
    requireApproval: base,
  };
});

let mongo: MongoMemoryServer;
let app: express.Express;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = express();
  app.use(express.json());
  app.use('/api/tickets', ticketsRouter);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const cols = await db.collections();
  for (const c of cols) await c.deleteMany({});
});


/** Seed one approved/published future event and one active ticket. */
const seed = async () => {
  const orgId = new Types.ObjectId();
  (global as any).__TEST_ORG__ = orgId; // used in the auth mock

  // Create an organization doc so populate('organization') returns a document
  const Organization = mongoose.model('Organization');
  await Organization.create({
    _id: orgId,
    name: 'Test Org',
    description: 'Seeded test organization',
    contactEmail: 'org@example.com',
    createdBy: new Types.ObjectId(),
  });
  const createdBy = new Types.ObjectId();
  // Create a future, approved, published event in that org
  const event = await EventModel.create({
    title: 'Test Event',
    description: '…',
    date: new Date(Date.now() + 24 * 3600 * 1000),
    startTime: '10:00',
    endTime: '12:00',
    location: 'Hall A',
    capacity: 100,
    organization: orgId,
    createdBy,
    status: 'published',
    isApproved: true,
    ticketType: 'free',
    ticketPrice: 0,
    category: 'social', // use a valid enum for your Event schema
  });

  // Optional: create a user the ticket will reference (helps populate('user'))
  const userId = new Types.ObjectId();
  const User = mongoose.model('User');
  await User.create({ _id: userId, firstName: 'Test', lastName: 'User', email: 't@example.com' });

  const eventIdObj = (event as mongoose.Document & { _id: Types.ObjectId })._id;
  const eventId = eventIdObj.toHexString();
  const ticketId = new Types.ObjectId().toHexString();
  const qrPayload = {
    ticketId,
    eventId,
    userId: userId.toHexString(),
    timestamp: new Date().toISOString(),
  };
  const qrDataString = JSON.stringify(qrPayload);

  await TicketModel.create({
    ticketId,
    event: event._id,
    user: userId,
    qrCode: qrDataString,   // EXACT string route expects in { qrData }
    status: 'active',
    price: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { event, ticketId, qrDataString };
};



describe('POST /api/tickets/validate (expects { qrData: string })', () => {
  it('returns 200 and valid:true when qrData matches stored ticket.qrCode string', async () => {
    const { qrDataString } = await seed();

    const res = await request(app)
      .post('/api/tickets/validate')
      .send({ qrData: qrDataString })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        valid: true,
        ticket: expect.objectContaining({
          ticketId: expect.any(String),
          status: 'active',
        }),
      })
    );
  });

  it('returns 404 (or 400) for a non-existing/invalid code', async () => {
    await seed();
    const bad = await request(app)
      .post('/api/tickets/validate')
      .send({
        qrData: JSON.stringify({
          ticketId: 'does-not-exist',
          eventId: new Types.ObjectId().toHexString(),
          userId: new Types.ObjectId().toHexString(),
          timestamp: new Date().toISOString(),
        }),
      });
    expect([404, 400]).toContain(bad.status);
  });

  it('is repeatable: validate twice still returns 200 (route does not mark used)', async () => {
    const { qrDataString } = await seed();

    await request(app).post('/api/tickets/validate').send({ qrData: qrDataString }).expect(200);
    const res2 = await request(app).post('/api/tickets/validate').send({ qrData: qrDataString }).expect(200);
    expect(res2.body.valid).toBe(true);
  });
});
