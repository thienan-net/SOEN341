// tests/events.test.ts
import request from "supertest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import app from "../src/app"; // your Express app
import User from "../src/models/User";
import Organization from "../src/models/Organization";
import EventModel from "../src/models/Event";

let mongoServer: MongoMemoryServer;
const JWT_SECRET = "test-secret";
process.env.JWT_SECRET = JWT_SECRET;

const makeToken = (userId: string) => jwt.sign({ userId }, JWT_SECRET);

beforeAll(async () => {
  jest.setTimeout(30000);
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const cols = await db.collections();
  for (const c of cols) await c.deleteMany({});
});

/** Helper to create a test user and return JWT */
const seedUser = async () => {
  const user = await User.create({
    email: "testuser@example.com",
    password: "password123",
    firstName: "Test",
    lastName: "User",
    role: "student",
  });
  const token = makeToken(String(user._id));
  return { user, token };
};

/** Helper to seed events */
const seedEvents = async () => {
  const orgId = new Types.ObjectId();
  const OrganizationModel = mongoose.model("Organization");
  await OrganizationModel.create({
    _id: orgId,
    name: "Seed Org",
    description: "Test organization for events",
    contactEmail: "org@example.com",
    createdBy: new Types.ObjectId(),
  });

  const createdBy = new Types.ObjectId();

  const plus1 = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const plus2 = new Date(Date.now() + 14 * 24 * 3600 * 1000);
  const plus3 = new Date(Date.now() + 30 * 24 * 3600 * 1000);

  await EventModel.insertMany([
    {
      title: "Basketball Tournament",
      description: "Campus-wide basketball competition",
      date: plus1,
      startTime: "10:00",
      endTime: "18:00",
      location: "Gym Hall A",
      category: "sports",
      ticketType: "free",
      capacity: 100,
      status: "published",
      isApproved: true,
      organization: orgId,
      createdBy,
      tags: ["competition", "athletics"],
    },
    {
      title: "Jazz Night",
      description: "An evening of live jazz music",
      date: plus2,
      startTime: "19:00",
      endTime: "22:00",
      location: "Student Lounge",
      category: "cultural",
      ticketType: "paid",
      ticketPrice: 15,
      capacity: 80,
      status: "published",
      isApproved: true,
      organization: orgId,
      createdBy,
      tags: ["music", "nightlife"],
    },
    {
      title: "Soccer Match",
      description: "Men’s interfaculty soccer match",
      date: plus3,
      startTime: "13:00",
      endTime: "15:00",
      location: "Main Field",
      category: "sports",
      ticketType: "free",
      capacity: 150,
      status: "published",
      isApproved: true,
      organization: orgId,
      createdBy,
      tags: ["sports", "game"],
    },
  ]);

  return { orgId, createdBy, plus1, plus2, plus3 };
};

describe("Feature 1.1 - Browse Campus Events", () => {
  test("GET /api/events returns a list of events", async () => {
    const { token } = await seedUser();
    await seedEvents();

    const res = await request(app)
      .get("/api/events")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("events");
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBe(3);
  });

  test("GET /api/events?category=sports filters events by category", async () => {
    const { token } = await seedUser();
    await seedEvents();

    const res = await request(app)
      .get("/api/events?category=sports")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("events");
    res.body.events.forEach((event: any) => expect(event.category).toBe("sports"));
  });
});
