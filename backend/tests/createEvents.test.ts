// tests/eventCreation.test.ts
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import app from "../src/app";
import User from "../src/models/User";
import Organization from "../src/models/Organization";
import Event from "../src/models/Event";

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

describe("Feature 2.1 - Event Creation", () => {
  test("POST /api/events creates a FREE event for an approved organizer", async () => {
    const orgId = new mongoose.Types.ObjectId();
    const organizer = await User.create({
      email: "org1@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "organizer",
      isApproved: true,
      organization: orgId,
    });
    await Organization.create({
      _id: orgId,
      name: "Tech Club",
      description: "University tech club",
      contactEmail: "contact@techclub.ca",
      createdBy: organizer._id,
    });

    const token = makeToken(String(organizer._id));

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "AI Workshop",
        description: "Learn AI basics",
        date: new Date().toISOString(),
        startTime: "10:00",
        endTime: "12:00",
        location: "H-110",
        category: "academic",
        ticketType: "free",
        capacity: 100,
      });

    expect([200, 201]).toContain(res.status);

    const body = (res.body && (res.body.data ?? res.body)) || {};
    expect(body).toHaveProperty("title", "AI Workshop");
    expect(body).toHaveProperty("ticketType", "free");

    const saved = await Event.findOne({ title: "AI Workshop" });
    expect(saved).not.toBeNull();
  });

  test("POST /api/events rejects PAID event without ticketPrice", async () => {
    const orgId = new mongoose.Types.ObjectId();
    const organizer = await User.create({
      email: "org2@example.com",
      password: "password123",
      firstName: "Jane",
      lastName: "Doe",
      role: "organizer",
      isApproved: true,
      organization: orgId,
    });
    await Organization.create({
      _id: orgId,
      name: "Music Club",
      description: "Live events",
      contactEmail: "music@club.ca",
      createdBy: organizer._id,
    });

    const token = makeToken(String(organizer._id));

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Concert Night",
        description: "Live music",
        date: new Date().toISOString(),
        startTime: "19:00",
        endTime: "22:00",
        location: "Auditorium",
        category: "social",
        ticketType: "paid",
        capacity: 200
        // ticketPrice missing
      });

    expect(res.status).toBe(400);
  });
});
