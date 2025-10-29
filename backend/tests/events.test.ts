import request from "supertest";
import app from "../src/app";
import mongoose from "mongoose";

describe("Feature 1.1 - Browse Campus Events", () => {
  const mongoUri = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/testdb";

  jest.setTimeout(10000); 

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase(); 
    await mongoose.connection.close(true);
  });

  test("GET /api/events returns a list of events", async () => {
    const res = await request(app).get("/api/events");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("events");
    expect(Array.isArray(res.body.events)).toBe(true);

    expect(res.body).toHaveProperty("pagination");
    expect(res.body.pagination).toHaveProperty("currentPage");
  });

  test("GET /api/events?category=sports filters events by category", async () => {
    const res = await request(app).get("/api/events?category=sports");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("events");
    expect(Array.isArray(res.body.events)).toBe(true);

    res.body.events.forEach((event: any) => {
      expect(event.category).toBe("sports");
    });
  });
});
