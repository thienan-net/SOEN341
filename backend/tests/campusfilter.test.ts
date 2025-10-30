import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app"; 
import Event from "../src/models/Event";

let mongoServer: MongoMemoryServer;

beforeAll(async () => 
{
    jest.setTimeout(30000);
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // sample events
    await Event.insertMany([
        {
        title: "Basketball Tournament",
        description: "Campus-wide basketball competition",
        category: "sports",
        date: new Date("2025-03-15"),
        startTime: "10:00",
        endTime: "18:00",
        location: "Gym Hall A",
        capacity: 100,
        status: "published",
        isApproved: true,
        },
        {
        title: "Jazz Night",
        description: "An evening of live jazz music",
        category: "music",
        date: new Date("2025-04-10"),
        startTime: "19:00",
        endTime: "22:00",
        location: "Student Lounge",
        capacity: 80,
        status: "published",
        isApproved: true,
        },
        {
        title: "Soccer Match",
        description: "Men’s interfaculty soccer match",
        category: "sports",
        date: new Date("2025-03-20"),
        startTime: "13:00",
        endTime: "15:00",
        location: "Main Field",
        capacity: 150,
        status: "published",
        isApproved: true,
        },
    ]);
    });

    afterAll(async () => 
        {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
        });

    describe("Feature 1.2 - Filter Campus Events", () => 
        {
        test("GET /api/events returns all events", async () => 
            {
            const res = await request(app).get("/api/events");
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("events");
            expect(Array.isArray(res.body.events)).toBe(true);
            expect(res.body.events.length).toBe(3);
            });

        test("GET /api/events?category=sports filters events by category", async () => 
            {
            const res = await request(app).get("/api/events?category=sports");
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("events");
            res.body.events.forEach((event: any) => {
            expect(event.category).toBe("sports");
            });
            expect(res.body.events.length).toBe(2);
            });

        test("GET /api/events?category=music filters events by category", async () => 
            {
            const res = await request(app).get("/api/events?category=music");
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("events");
            expect(res.body.events.length).toBe(1);
            expect(res.body.events[0].title).toBe("Jazz Night");
            });

        test("GET /api/events?search=basketball filters events by search term in title/description", async () => 
            {
                const res = await request(app).get("/api/events?search=basketball");
                expect(res.status).toBe(200);
                expect(res.body.events.length).toBe(1);
                expect(res.body.events[0].title).toContain("Basketball");
            });

        test("GET /api/events?date=2025-03-15 filters events by exact date", async () => 
            {
                const res = await request(app).get("/api/events?date=2025-03-15");
                expect(res.status).toBe(200);
                expect(res.body.events.length).toBe(1);
                expect(res.body.events[0].title).toBe("Basketball Tournament");
            });

        test("GET /api/events?category=nonexistent returns empty array", async () => 
            {
                const res = await request(app).get("/api/events?category=nonexistent");
                expect(res.status).toBe(200);
                expect(Array.isArray(res.body.events)).toBe(true);
                expect(res.body.events.length).toBe(0);
            });
        });
