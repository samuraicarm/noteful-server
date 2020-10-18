const { expect } = require("chai");
const supertest = require("supertest");
const app = require("../app");

describe("Noteful App", () => {
  it("should return a message from GET /", () => {
    return supertest(app).get("/").expect(200, "Hello Noteful!");
  });
});
