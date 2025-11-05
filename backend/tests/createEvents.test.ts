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
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Feature 1.2 - Organizer Creates Event", () => {
  test("POST /api/events creates a free event", async () => {
    const organizer = await User.create({
      email: "org1@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "organizer",
      isApproved: true,
    });

    const org = await Organization.create({
      name: "Tech Club",
      description: "University tech club",
      contactEmail: "contact@techclub.ca",
      createdBy: organizer._id,
    });
    organizer.organization = org._id as any;
    await organizer.save();

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
    expect(res.body).toHaveProperty("title", "AI Workshop");
    const event = await Event.findOne({ title: "AI Workshop" });
    expect(event).not.toBeNull();
  });

  test("POST /api/events rejects paid event without ticketPrice", async () => {
    const organizer = await User.create({
      email: "org2@example.com",
      password: "password123",
      firstName: "Jane",
      lastName: "Doe",
      role: "organizer",
      isApproved: true,
    });

    const org = await Organization.create({
      name: "Music Club",
      description: "Live events",
      contactEmail: "music@club.ca",
      createdBy: organizer._id,
    });
    organizer.organization = org._id as any;
    await organizer.save();

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
        capacity: 200,
        // ticketPrice missing
      });

    expect(res.status).toBe(400);
  });

  test("POST /api/events rejects unapproved organizer", async () => {
    const organizer = await User.create({
      email: "org3@example.com",
      password: "password123",
      firstName: "Sam",
      lastName: "Smith",
      role: "organizer",
      isApproved: false,
    });

    const org = await Organization.create({
      name: "Career Club",
      description: "Careers",
      contactEmail: "career@club.ca",
      createdBy: organizer._id,
    });
    organizer.organization = org._id as any;
    await organizer.save();

    const token = makeToken(String(organizer._id));

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Unauthorized Meetup",
        description: "Should fail",
        date: new Date().toISOString(),
        startTime: "15:00",
        endTime: "17:00",
        location: "H-120",
        category: "career",
        ticketType: "free",
        capacity: 30,
      });

    expect(res.status).toBe(403);
  });
});
