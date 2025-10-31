import request from 'supertest';
import express from 'express';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import ticketsRouter from '../src/routes/tickets';
import TicketModel from '../src/models/Ticket';

// Mock auth (covers default, authenticate, authorize('role'), and guards)
jest.mock('../src/middleware/auth', () => {
  const { Types } = require('mongoose');
  const base = (req: any, _res: any, next: any) => {
    req.user = { _id: new Types.ObjectId(), roles: ['organizer'] };
    next();
  };
  const authorize = (_role: string) => base;
  return {
    __esModule: true,
    default: base,
    authenticate: base,
    authorize,
    requireOrganizer: base,
    requireAdmin: base,
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

describe('POST /api/tickets/validate', () => {
  const seed = async () => {
    const ticketId = new Types.ObjectId().toHexString(); // valid MongoId string
    const qrCode = 'TEST-CODE-123';

    await TicketModel.create({
      event: new Types.ObjectId(),
      user: new Types.ObjectId(),
      ticketId,      // required by your schema
      qrCode,        // keep in DB if your model stores it
      status: 'active',
      price: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { ticketId, qrCode };
  };

  it('first scan validates & marks ticket as used', async () => {
    const { ticketId, qrCode } = await seed();


    const res = await request(app)
        .post('/api/tickets/validate')
        .send({ qrData: { ticketId } })       // ← send qrData object
        .expect(200);

    expect(res.body).toEqual(expect.objectContaining({ valid: expect.any(Boolean) }));

    const updated = await TicketModel.findOne({ ticketId }).lean();
    expect(updated?.status).toBe('used');
    expect(updated?.usedAt).toBeTruthy();
  });

  it('second scan is idempotent (already used)', async () => {
    const { ticketId } = await seed();

    await request(app).post('/api/tickets/validate').send({ qrData: { ticketId } }).expect(200);
    const res2 = await request(app)
        .post('/api/tickets/validate')
        .send({ qrData: { ticketId } })
        .expect(200);

    const already =
      res2.body?.alreadyCheckedIn === true ||
      res2.body?.valid === false ||
      /already\s*(checked\s*in|used)/i.test(res2.body?.message ?? '');

    expect(already).toBe(true);

    const after = await TicketModel.findOne({ ticketId }).lean();
    expect(after?.status).toBe('used');
    expect(after?.usedAt).toBeTruthy();
  });

  it('invalid ticketId is rejected', async () => {
    // Use a *valid* ObjectId that doesn't exist to avoid format 400s
    const nonexistent = new Types.ObjectId().toHexString();
    const bad = await request(app)
        .post('/api/tickets/validate')
        .send({ qrData: { ticketId: nonexistent } });
    expect([404, 200, 400]).toContain(bad.status);
    if (bad.status === 200) expect(bad.body.valid).toBe(false);
  });
});
