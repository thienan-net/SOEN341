// backend/tests/qr.test.ts
import request from 'supertest';
import express from 'express';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Mount ONLY the tickets router
import ticketsRouter from '../src/routes/tickets';
import TicketModel from '../src/models/Ticket';
import EventModel from '../src/models/Event';

// --- auth mock: always organizer; organization comes from global __TEST_ORG__
jest.mock('../src/middleware/auth', () => {
  const { Types } = require('mongoose');
  const base = (req: any, _res: any, next: any) => {
    req.user = {
      _id: new Types.ObjectId(),
      roles: ['organizer'],
      // set in seed(): (global as any).__TEST_ORG__ = <ObjectId>
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

/**
 * Seed one published/approved future event in org, plus one active ticket.
 * IMPORTANT: we store ticket.qrCode as the EXACT JSON string; tests must send
 * the same string back as { qrData: "<that string>" }.
 */
const seed = async () => {
  const orgId = new Types.ObjectId();
  (global as any).__TEST_ORG__ = orgId; // used by auth mock

  const event = await EventModel.create({
    title: 'Test Event',
    description: '…',
    date: new Date(Date.now() + 24 * 3600 * 1000), // tomorrow
    startTime: '10:00',
    endTime: '12:00',
    location: 'Hall A',
    capacity: 100,
    organization: orgId,
    status: 'published',
    isApproved: true,
    ticketType: 'free',
    ticketPrice: 0,
    category: 'general',
  });

  // 👇 Make TS aware that _id is an ObjectId
  const eventIdObj = (event as mongoose.Document & { _id: Types.ObjectId })._id;
  const eventId = eventIdObj.toHexString(); // use string inside QR payload

  const ticketId = new Types.ObjectId().toHexString();
  const qrPayload = {
    ticketId,
    eventId, // string inside the QR JSON
    userId: new Types.ObjectId().toHexString(),
    timestamp: new Date().toISOString(),
  };
  const qrDataString = JSON.stringify(qrPayload); // <-- this is what the route expects

  await TicketModel.create({
    ticketId,
    event: eventIdObj, // store as ObjectId in DB
    user: new Types.ObjectId(),
    qrCode: qrDataString, // EXACT string stored in DB
    status: 'active',
    price: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { eventId, ticketId, qrDataString };
};

describe('POST /api/tickets/validate (expects { qrData: string })', () => {
  it('returns 200 and valid:true when qrData matches stored ticket.qrCode string', async () => {
    const { qrDataString } = await seed();

    const res = await request(app)
      .post('/api/tickets/validate')
      .send({ qrData: qrDataString }) // <-- send the exact stored string
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

    // same shape (string) but different content -> not found (or 400)
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

  it('is repeatable: validate twice still returns 200 (this route does not mark used)', async () => {
    const { qrDataString } = await seed();

    await request(app)
      .post('/api/tickets/validate')
      .send({ qrData: qrDataString })
      .expect(200);

    // still 200 because marking "used" happens at POST /:id/use, not here
    const res2 = await request(app)
      .post('/api/tickets/validate')
      .send({ qrData: qrDataString })
      .expect(200);

    expect(res2.body.valid).toBe(true);
  });
});
