/// <reference types="jest" />
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import User from "../src/models/User";
import Board from "../src/models/Board";

// Mock Postmark before app import so authController uses mocked client
jest.mock("postmark", () => {
  return {
    ServerClient: jest.fn().mockImplementation(() => ({
      sendEmail: jest.fn().mockResolvedValue({ Message: "ok" }),
    })),
  };
});

import app from "../src/app";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.POSTMARK_API_KEY = process.env.POSTMARK_API_KEY || "test-postmark-key";
  process.env.POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "test@example.com";

  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});

export const api = request(app);
export { User, Board };