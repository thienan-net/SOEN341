import request from 'supertest';
import express from 'express';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import EventModel from '../src/models/Event';
import '../src/models/User';
import '../src/models/Organization';
import eventsRouter from '../src/routes/events'; // adjust if route path differs

let mongo: MongoMemoryServer;
let app: express.Express;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = express();
  app.use(express.json());
  app.use('/api/events', eventsRouter);
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

/** Helper to seed 3 published/approved future events for testing */
const seedEvents = async () => {
  const orgId = new Types.ObjectId();
  const Organization = mongoose.model('Organization');
  await Organization.create({
    _id: orgId,
    name: 'Seed Org',
    description: 'Test organization for filter tests',
    contactEmail: 'org@example.com',
    createdBy: new Types.ObjectId(),
  });

  const createdBy = new Types.ObjectId();

  // all future dates relative to now
  const plus1 = new Date(Date.now() + 7 * 24 * 3600 * 1000);   // +7 days
  const plus2 = new Date(Date.now() + 14 * 24 * 3600 * 1000);  // +14 days
  const plus3 = new Date(Date.now() + 30 * 24 * 3600 * 1000);  // +30 days

  await EventModel.insertMany([
    {
      title: 'Basketball Tournament',
      description: 'Campus-wide basketball competition',
      date: plus1,
      startTime: '10:00',
      endTime: '18:00',
      location: 'Gym Hall A',
      category: 'sports',
      ticketType: 'free',
      capacity: 100,
      status: 'published',
      isApproved: true,
      organization: orgId,
      createdBy,
      tags: ['competition', 'athletics'],
    },
    {
      title: 'Jazz Night',
      description: 'An evening of live jazz music',
      date: plus2,
      startTime: '19:00',
      endTime: '22:00',
      location: 'Student Lounge',
      category: 'cultural',
      ticketType: 'paid',
      ticketPrice: 15,
      capacity: 80,
      status: 'published',
      isApproved: true,
      organization: orgId,
      createdBy,
      tags: ['music', 'nightlife'],
    },
    {
      title: 'Soccer Match',
      description: 'Men’s interfaculty soccer match',
      date: plus3,
      startTime: '13:00',
      endTime: '15:00',
      location: 'Main Field',
      category: 'sports',
      ticketType: 'free',
      capacity: 150,
      status: 'published',
      isApproved: true,
      organization: orgId,
      createdBy,
      tags: ['sports', 'game'],
    },
  ]);

  return { orgId, createdBy, plus1, plus2, plus3 };
};

describe('Feature 1.2 – Filter Campus Events', () => {
  it('GET /api/events returns all published & approved events', async () => {
    await seedEvents();

    const res = await request(app).get('/api/events').expect(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBe(3);
  });

  it('GET /api/events?category=sports filters events by category', async () => {
    await seedEvents();

    const res = await request(app).get('/api/events?category=sports').expect(200);
    const events = res.body.events || [];
    expect(events.length).toBe(2);
    events.forEach((e: any) => expect(e.category).toBe('sports'));
  });

  it('GET /api/events?category=cultural filters events by category', async () => {
    await seedEvents();

    const res = await request(app).get('/api/events?category=cultural').expect(200);
    const events = res.body.events || [];
    expect(events.length).toBe(1);
    expect(events[0].title).toBe('Jazz Night');
  });
  

  it('GET /api/events?search=basketball filters by search term', async () => {
    await seedEvents();

    const res = await request(app).get('/api/events?search=basketball').expect(200);
    const events = res.body.events || [];
    expect(events.length).toBe(1);
    expect(events[0].title).toContain('Basketball');
  });

  it('GET /api/events?date filters by exact date', async () => {
    const { plus1 } = await seedEvents();

    const dateParam = plus1.toISOString().split('T')[0];
    const res = await request(app).get(`/api/events?date=${dateParam}`).expect(200);
    const events = res.body.events || [];
    expect(events.length).toBe(1);
    expect(events[0].title).toBe('Basketball Tournament');
  });

  it('GET /api/events?category=invalid returns 400 for invalid category', async () => {
    await seedEvents();

    const res = await request(app).get('/api/events?category=invalid');
    expect([400, 422]).toContain(res.status);
  });
});
