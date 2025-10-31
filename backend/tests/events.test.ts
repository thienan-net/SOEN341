import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app"; // your Express app

let mongoServer: MongoMemoryServer;

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

describe("Feature 1.1 - Browse Campus Events", () => {
  test("GET /api/events returns a list of events", async () => {
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("events");
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  test("GET /api/events?category=sports filters events by category", async () => {
    const res = await request(app).get("/api/events?category=sports");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("events");
    if (res.body.events.length > 0) {
      res.body.events.forEach((event: any) => expect(event.category).toBe("sports"));
    }
  });
});
