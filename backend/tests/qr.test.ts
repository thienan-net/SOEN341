import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";              
import EventModel from '../src/models/Event';      
import TicketModel from '../src/models/Ticket';    

// Since QR validation route is protected, we need to mock auth middleware
jest.mock('../middleware/auth', () => ({
  // attach a fake organizer user to every request
  default: (_req: any, _res: any, next: any) => {
    _req.user = { _id: new mongoose.Types.ObjectId(), roles: ['organizer'] };
    next();
  },
}));

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  for (const c of collections) await c.deleteMany({});
});

describe('POST /api/tickets/validate', () => {
  const seed = async () => {
    const event = await EventModel.create({
      orgId: new mongoose.Types.ObjectId(),
      title: 'Tech Talk',
      description: 'Desc',
      category: 'tech',
      startsAt: new Date(Date.now() + 60 * 60 * 1000),
      endsAt:   new Date(Date.now() + 2 * 60 * 60 * 1000),
      location: 'Room A',
      status: 'approved',
      ticketType: 'free',  // ✅ your model
      capacity: 100,
    });

    const code = 'TEST-CODE-123';

    await TicketModel.create({
      event: event._id,                     
      user: new mongoose.Types.ObjectId(),  
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

    // Response shape varies by your handler; keep this permissive:
    expect(res.body).toEqual(
      expect.objectContaining({ valid: expect.any(Boolean) })
    );

    const updated = await TicketModel.findOne({ qrCode: code }).lean();
    // ✅ your model uses status/usedAt:
    expect(updated?.status).toBe('used');
    expect(updated?.usedAt).toBeTruthy();
  });

  it('second scan is idempotent (already used)', async () => {
    const { code } = await seed();

    await request(app).post('/api/tickets/validate').send({ qrCode: code }).expect(200);
    const res2 = await request(app).post('/api/tickets/validate').send({ qrCode: code }).expect(200);

    // Allow any of these conventions:
    const already =
      res2.body?.alreadyCheckedIn === true ||
      res2.body?.valid === false ||
      /already\s*checked\s*in|already\s*used/i.test(res2.body?.message ?? '');

    expect(already).toBe(true);

    const after = await TicketModel.findOne({ qrCode: code }).lean();
    expect(after?.status).toBe('used');
    expect(after?.usedAt).toBeTruthy();
  });

  it('invalid code is rejected', async () => {
    const res = await request(app)
      .post('/api/tickets/validate')
      .send({ qrCode: 'NON-EXISTENT' });

    // some teams return 404/400; others return 200 with {valid:false}
    expect([200, 400, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toEqual(expect.objectContaining({ valid: false }));
    }
  });
});