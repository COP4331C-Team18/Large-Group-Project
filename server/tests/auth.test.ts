import { api, User } from "./setup";

describe("Auth API", () => {
  it("should sign up a new user", async () => {
    const res = await api.post("/api/auth/signup").send({
      username: "john",
      email: "john@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("john@example.com");
    expect(res.body.message).toBeDefined();
  });

  it("should verify email and log in a user", async () => {
    await api.post("/api/auth/signup").send({
      username: "john",
      email: "john@example.com",
      password: "Password123!",
    });

    const user = await User.findOne({ email: "john@example.com" });
    const verificationCode = user?.verificationCode;

    const verifyRes = await api.post("/api/auth/verify-email").send({
      email: "john@example.com",
      verificationCode,
    });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.user.email).toBe("john@example.com");
    expect(verifyRes.headers["set-cookie"]).toBeDefined();
  });

  it("should log in a verified user with email", async () => {
    await api.post("/api/auth/signup").send({
      username: "john",
      email: "john@example.com",
      password: "Password123!",
    });

    const user = await User.findOne({ email: "john@example.com" });
    await api.post("/api/auth/verify-email").send({
      email: "john@example.com",
      verificationCode: user?.verificationCode,
    });

    const loginRes = await api.post("/api/auth/login").send({
      login: "john@example.com",
      password: "Password123!",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe("john@example.com");
    expect(loginRes.headers["set-cookie"]).toBeDefined();
  });

  it("should log in a verified user with username", async () => {
    await api.post("/api/auth/signup").send({
      username: "john",
      email: "john@example.com",
      password: "Password123!",
    });

    const user = await User.findOne({ email: "john@example.com" });
    await api.post("/api/auth/verify-email").send({
      email: "john@example.com",
      verificationCode: user?.verificationCode,
    });

    const loginRes = await api.post("/api/auth/login").send({
      login: "john",
      password: "Password123!",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.username).toBe("john");
    expect(loginRes.headers["set-cookie"]).toBeDefined();
  });

  it("should return authenticated user from /auth/me", async () => {
    await api.post("/api/auth/signup").send({
      username: "john",
      email: "john@example.com",
      password: "Password123!",
    });

    const user = await User.findOne({ email: "john@example.com" });
    await api.post("/api/auth/verify-email").send({
      email: "john@example.com",
      verificationCode: user?.verificationCode,
    });

    const loginRes = await api.post("/api/auth/login").send({
      login: "john@example.com",
      password: "Password123!",
    });

    const cookie = loginRes.headers["set-cookie"];

    const meRes = await api.get("/api/auth/me").set("Cookie", cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.authenticated).toBe(true);
    expect(meRes.body.user.email).toBe("john@example.com");
  });

  it("should deny login to unverified email", async () => {
    await api.post("/api/auth/signup").send({
      username: "john",
      email: "john@example.com",
      password: "Password123!",
    });

    const res = await api.post("/api/auth/login").send({
      login: "john@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Email not verified");
  });

  it("should reject invalid password", async () => {
    await api.post("/api/auth/signup").send({
      username: "john",
      email: "john@example.com",
      password: "Password123!",
    });

    const user = await User.findOne({ email: "john@example.com" });
    await api.post("/api/auth/verify-email").send({
      email: "john@example.com",
      verificationCode: user?.verificationCode,
    });

    const res = await api.post("/api/auth/login").send({
      login: "john@example.com",
      password: "WrongPassword123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Invalid login or password");
  });
});
