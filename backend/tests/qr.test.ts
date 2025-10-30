import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { Types } from 'mongoose';
import { MongoMemoryServer } from "mongodb-memory-server";

// Mount ONLY the tickets router to avoid unrelated middleware/routes
import ticketsRouter from '../src/routes/tickets';
import TicketModel from '../src/models/Ticket';

// Mock auth to always allow
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

// ---------- tests ----------
describe('POST /api/tickets/validate', () => {
  const seed = async () => {
    const code = 'TEST-CODE-123';

  await TicketModel.create({
    event: new Types.ObjectId(),
    user: new Types.ObjectId(),
    ticketId: new Types.ObjectId().toHexString(),   // or any unique string/uuid
    qrCode: code,
    status: 'active',
    price: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    });

    return { code };
  };

  it('first scan validates & marks ticket as used', async () => {
    const { code } = await seed();

    const res = await request(app)
      .post('/api/tickets/validate')
      .send({ qrCode: code })
      .expect(200);

    // response shape can vary; just assert "valid" exists
    expect(res.body).toEqual(expect.objectContaining({ valid: expect.any(Boolean) }));

    const updated = await TicketModel.findOne({ qrCode: code }).lean();
    expect(updated?.status).toBe('used');
    expect(updated?.usedAt).toBeTruthy();
  });

  it('second scan is idempotent (already used)', async () => {
    const { code } = await seed();

    await request(app).post('/api/tickets/validate').send({ qrCode: code }).expect(200);
    const res2 = await request(app).post('/api/tickets/validate').send({ qrCode: code }).expect(200);

    const already =
      res2.body?.alreadyCheckedIn === true ||
      res2.body?.valid === false ||
      /already\s*(checked\s*in|used)/i.test(res2.body?.message ?? '');

    expect(already).toBe(true);

    const after = await TicketModel.findOne({ qrCode: code }).lean();
    expect(after?.status).toBe('used');
    expect(after?.usedAt).toBeTruthy();
  });

  it('invalid code is rejected', async () => {
    const res = await request(app).post('/api/tickets/validate').send({ qrCode: 'NOPE' });
    expect([200, 400, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toEqual(expect.objectContaining({ valid: false }));
    }
  });
});
