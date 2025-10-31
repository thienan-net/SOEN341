import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";
import Event from "../src/models/Event";

// --- extend timeout for slow CI environments ---
jest.setTimeout(60000);

let mongoServer: MongoMemoryServer;
let orgId: mongoose.Types.ObjectId;
let userId: mongoose.Types.ObjectId;
let nextMonth: Date;
let twoMonths: Date;
let threeMonths: Date;

// --- ignore duplicate index warnings from Ticket schema ---
process.on("warning", (warning) => {
  if (warning.message.includes("Duplicate schema index")) {
    console.info("⚠️  Ignored duplicate index warning:", warning.message);
  }
});

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // ✅ Ensure connection is fully established
  await mongoose.connection.asPromise();
  await new Promise((res) => setTimeout(res, 200));

  // Mock system time for consistent filtering
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01"));

  // Static ObjectIds used for all events
  orgId = new mongoose.Types.ObjectId();
  userId = new mongoose.Types.ObjectId();

  // Prepare known future dates
  nextMonth = new Date("2025-02-01");
  twoMonths = new Date("2025-03-01");
  threeMonths = new Date("2025-04-01");
});

beforeEach(async () => {
  await Event.deleteMany({});

  // Always future dates so date >= now passes controller filter
  const now = new Date();
  const plus1 = new Date(now.getFullYear(), now.getMonth() + 1, 10);
  const plus2 = new Date(now.getFullYear(), now.getMonth() + 2, 10);
  const plus3 = new Date(now.getFullYear(), now.getMonth() + 3, 10);

  await Event.insertMany([
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
      createdBy: userId,
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
      createdBy: userId,
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
      createdBy: userId,
      tags: ["sports", "game"],
    },
  ]);

  // ✅ Ensure DB flush completes before HTTP requests
  if (mongoose.connection.db) {
    await mongoose.connection.db.command({ ping: 1 });
  }
});

afterAll(async () => {
  jest.useRealTimers();
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe("Feature 1.2 – Filter Campus Events", () => {
  test("GET /api/events returns all published & approved events", async () => {
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    const events = res.body.events || res.body.data || [];
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(3);
  });

  test("GET /api/events?category=sports filters events by category", async () => {
    const res = await request(app).get("/api/events?category=sports");
    expect(res.status).toBe(200);
    const events = res.body.events || [];
    expect(events.length).toBe(2);
    events.forEach((e: any) => expect(e.category).toBe("sports"));
  });

  test("GET /api/events?category=cultural filters events by category", async () => {
    const res = await request(app).get("/api/events?category=cultural");
    expect(res.status).toBe(200);
    const events = res.body.events || [];
    expect(events.length).toBe(1);
    expect(events[0].title).toBe("Jazz Night");
  });

  test("GET /api/events?search=basketball filters events by search term", async () => {
    const res = await request(app).get("/api/events?search=basketball");
    expect(res.status).toBe(200);
    const events = res.body.events || [];
    expect(events.length).toBe(1);
    expect(events[0].title).toContain("Basketball");
  });

  test("GET /api/events?date filters by exact date", async () => {
    const dateParam = nextMonth.toISOString().split("T")[0];
    const res = await request(app).get(`/api/events?date=${dateParam}`);
    expect(res.status).toBe(200);
    const events = res.body.events || [];
    expect(events.length).toBe(1);
    expect(events[0].title).toBe("Basketball Tournament");
  });

  test("GET /api/events?category=invalid returns 400 for invalid category", async () => {
    const res = await request(app).get("/api/events?category=invalid");
    expect([400, 422]).toContain(res.status);
  });
});
