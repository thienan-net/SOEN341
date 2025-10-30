import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";
import Event from "../src/models/Event";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    jest.setTimeout(30000);
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const userId = new mongoose.Types.ObjectId();
    const orgId = new mongoose.Types.ObjectId();

    // ✅ Ensure these match controller expectations
    await Event.insertMany([
        {
        title: "Basketball Tournament",
        description: "Campus-wide basketball competition",
        date: new Date("2025-12-15"),
        startTime: "10:00",
        endTime: "18:00",
        location: "Gym Hall A",
        category: "sports",
        ticketType: "free",
        capacity: 100,
        status: "published",    // ✅ default visible status
        isApproved: true,       // ✅ required for visibility
        organization: orgId,
        createdBy: userId,
        tags: ["competition", "athletics"]
        },
        {
        title: "Jazz Night",
        description: "An evening of live jazz music",
        date: new Date("2025-12-10"),
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
        tags: ["music", "nightlife"]
        },
        {
        title: "Soccer Match",
        description: "Men’s interfaculty soccer match",
        date: new Date("2025-12-20"),
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
        tags: ["sports", "game"]
        }
    ]);
    });

    afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    });

    describe("Feature 1.2 - Filter Campus Events", () => {
    test("GET /api/events returns all events", async () => {
        const res = await request(app).get("/api/events");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("events");
        expect(Array.isArray(res.body.events)).toBe(true);
        expect(res.body.events.length).toBe(3);
    });

    test("GET /api/events?category=sports filters events by category", async () => {
        const res = await request(app).get("/api/events?category=sports");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("events");
        expect(res.body.events.length).toBe(2);
        res.body.events.forEach((event: any) => {
        expect(event.category).toBe("sports");
        });
    });

    test("GET /api/events?category=cultural filters events by category", async () => {
        const res = await request(app).get("/api/events?category=cultural");
        expect(res.status).toBe(200);
        expect(res.body.events.length).toBe(1);
        expect(res.body.events[0].title).toBe("Jazz Night");
    });

    test("GET /api/events?search=basketball filters events by search term", async () => {
        const res = await request(app).get("/api/events?search=basketball");
        expect(res.status).toBe(200);
        expect(res.body.events.length).toBe(1);
        expect(res.body.events[0].title).toContain("Basketball");
    });

    test("GET /api/events?date filters by exact date", async () => {
    const res = await request(app).get(`/api/events?date=${nextMonth.toISOString().split('T')[0]}`);
    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(1);
    expect(res.body.events[0].title).toBe("Basketball Tournament");
    });


    test("GET /api/events?category=nonexistent returns 400 for invalid category", async () => {
        const res = await request(app).get("/api/events?category=nonexistent");
        expect([400, 422]).toContain(res.status); // ✅ support either depending on controller
    });
    });
