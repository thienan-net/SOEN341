import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import createApp from "../src/app";               // your express app factory (preferred)


// If you export the app directly, use: import app from '../app';
import EventModel from '../src/models/Event';       // Mongoose model for events
import TicketModel from '../src/models/Ticket';     // Mongoose model for tickets

// --- If your route requires organizer auth, stub the auth middleware:
jest.mock('../middleware/auth', () => ({
  // attach a fake organizer user to every request
  default: (_req: any, _res: any, next: any) => {
    _req.user = { _id: new mongoose.Types.ObjectId(), roles: ['organizer'] };
    next();
  },
}));

let mongo: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  // If your app factory accepts options, pass skipDb or similar if you have it
  // e.g., app = createApp({ skipDb: true });
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  // clean all collections between tests
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) await c.deleteMany({});
});

describe('POST /api/tickets/validate (QR scanning)', () => {
  const seed = async () => {
    // 1) Create an event with one ticket type
    const event = await EventModel.create({
      orgId: new mongoose.Types.ObjectId(),
      title: 'Tech Talk',
      description: 'Cool event',
      category: 'tech',
      startsAt: new Date(Date.now() + 60 * 60 * 1000), // starts in 1h
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      location: 'Room A',
      status: 'approved',
      ticketTypes: [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'General',
          type: 'free',
          capacity: 100,
          perUserLimit: 1,
        },
      ],
    });

    // 2) Issue a ticket for that event
    const code = 'TEST-CODE-123';
    const tTypeId = event.ticketTypes[0]._id;
    const ticket = await TicketModel.create({
      eventId: event._id,
      ticketTypeId: tTypeId,
      userId: new mongoose.Types.ObjectId(),
      code,                 // UNIQUE index in your schema
      issuedAt: new Date(),
      status: 'active',
    });

    return { event, ticket, code };
  };

  it('first scan should validate & stamp checkedInAt', async () => {
    const { code } = await seed();

    const res = await request(app)
      .post('/api/tickets/validate')
      .send({ code })
      .expect(200);

    // Be flexible with your response shape; these are common fields:
    expect(res.body).toMatchObject({
      valid: true,
    });
    // verify DB side-effect
    const updated = await TicketModel.findOne({ code }).lean();
    expect(updated?.checkedInAt).toBeTruthy();
  });

  it('second scan should be idempotent (already checked in)', async () => {
    const { code } = await seed();

    // first scan
    await request(app).post('/api/tickets/validate').send({ code }).expect(200);

    // second scan
    const res2 = await request(app)
      .post('/api/tickets/validate')
      .send({ code })
      .expect(200);

    // Typical patterns: valid:false OR alreadyCheckedIn:true
    // Assert at least one of them is present/true:
    const flags = {
      valid: res2.body?.valid ?? null,
      alreadyCheckedIn: res2.body?.alreadyCheckedIn ?? null,
      message: res2.body?.message ?? '',
    };

    // Accept either explicit flag or a descriptive message
    expect(
      flags.alreadyCheckedIn === true ||
      flags.valid === false ||
      /already\s*checked\s*in/i.test(flags.message)
    ).toBe(true);

    const after = await TicketModel.findOne({ code }).lean();
    expect(after?.checkedInAt).toBeTruthy(); // still stamped
  });

  it('invalid code should be rejected', async () => {
    const res = await request(app)
      .post('/api/tickets/validate')
      .send({ code: 'NON-EXISTENT' });

    // Some teams return 404, others 200 with {valid:false}. Accept both:
    expect([200, 400, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toMatchObject({ valid: false });
    }
  });
});