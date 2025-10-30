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
}
);

afterAll(async () => 
{
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
}
);

beforeEach(async () => 
{
    await Event.deleteMany({});
    await Event.insertMany([
    {
        title: "AI Conference",
        category: "Technology",
        location: "SGW Campus",
        date: new Date("2025-11-01"),
        startTime: "09:00",
        endTime: "17:00",
        ticketType: "free",
    },
    {
        title: "Music Night",
        category: "Music",
        location: "Loyola Campus",
        date: new Date("2025-11-03"),
        startTime: "19:00",
        endTime: "22:00",
        ticketType: "paid",
    },
    {
        title: "Career Fair",
        category: "Career",
        location: "SGW Campus",
        date: new Date("2025-11-10"),
        startTime: "10:00",
        endTime: "15:00",
        ticketType: "free",
    },
  ]);
}
);

describe("filter events", () => 
{
    test("GET /api/events?campus=SGW filters events by campus", async () => 
    {
        const res = await request(app).get("/api/events?campus=SGW Campus");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.events)).toBe(true);
        expect(res.body.events.length).toBeGreaterThan(0);
        res.body.events.forEach((e: any) =>
        expect(e.location).toBe("SGW Campus")
    );
    }
    );

    test("GET /api/events?category=Music filters events by category", async () => 
    {
        const res = await request(app).get("/api/events?category=Music");
        expect(res.status).toBe(200);
        res.body.events.forEach((e: any) => expect(e.category).toBe("Music"));
    });

    test("GET /api/events?dateRange=today filters events by today's date", async () => 
    {
        const today = new Date().toISOString().split("T")[0];
        const res = await request(app).get(`/api/events?dateRange=today`);
        expect(res.status).toBe(200);
        res.body.events.forEach((e: any) => {
        const eventDate = new Date(e.date).toISOString().split("T")[0];
        expect(eventDate).toBe(today);
        });
    });

    test("GET /api/events?campus=SGW&category=Technology filters by both", async () => 
    {
        const res = await request(app).get("/api/events?campus=SGW Campus&category=Technology");
        expect(res.status).toBe(200);
        res.body.events.forEach((e: any) => {
        expect(e.location).toBe("SGW Campus");
        expect(e.category).toBe("Technology");
        });
    });
});
