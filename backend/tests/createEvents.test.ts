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
process.env.JWT_EXPIRE = "7d";

const makeToken = (userId: string) => jwt.sign({ userId }, JWT_SECRET);

beforeAll(async () => {
  jest.setTimeout(30000); // 30 seconds
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
  test("POST /api/events creates a FREE event for approved organizer", async () => {
    const organizer = await User.create({
      email: "org1@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "organizer",
      isApproved: true,
    });

    const organization = await Organization.create({
      name: "Tech Club",
      description: "University tech club",
      contactEmail: "contact@techclub.ca",
      createdBy: organizer._id,
    });

    organizer.organization = organization._id as any;
    await organizer.save();

    const token = makeToken((organizer._id as any).toString());

    const newEvent = {
      title: "Intro to AI Workshop",
      description: "Learn about AI and ML basics",
      date: new Date().toISOString(),
      startTime: "10:00",
      endTime: "12:00",
      location: "H-110",
      category: "academic",
      ticketType: "free",
      capacity: 100,
    };

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(newEvent);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("title", newEvent.title);
    expect(res.body).toHaveProperty("ticketType", "free");

    const eventInDb = await Event.findOne({ title: "Intro to AI Workshop" });
    expect(eventInDb).not.toBeNull();
    expect(eventInDb?.createdBy?.toString()).toBe((organizer._id as any).toString());
  });

  test("POST /api/events rejects PAID event without ticketPrice", async () => {
    const organizer = await User.create({
      email: "org2@example.com",
      password: "password123",
      firstName: "Jane",
      lastName: "Doe",
      role: "organizer",
      isApproved: true,
    });

    const token = makeToken((organizer._id as any).toString());

    const invalidEvent = {
      title: "Paid Concert",
      description: "Live performance night",
      date: new Date().toISOString(),
      startTime: "19:00",
      endTime: "22:00",
      location: "Auditorium A",
      category: "social",
      ticketType: "paid",
      capacity: 200,
      // missing ticketPrice
    };

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(invalidEvent);

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body).toLowerCase()).toContain("ticketprice");
  });

  test("POST /api/events rejects unapproved organizer", async () => {
    const organizer = await User.create({
      email: "org3@example.com",
      password: "password123",
      firstName: "Unapproved",
      lastName: "Org",
      role: "organizer",
      isApproved: false,
    });

    const token = makeToken((organizer._id as any).toString());

    const newEvent = {
      title: "Unauthorized Meetup",
      description: "Event attempt by unapproved organizer",
      date: new Date().toISOString(),
      startTime: "15:00",
      endTime: "17:00",
      location: "H-120",
      category: "career",
      ticketType: "free",
      capacity: 30,
    };

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(newEvent);

    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body).toLowerCase()).toContain("approval");
  });
});
