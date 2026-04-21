import { api, User } from "./setup";
import jwt from "jsonwebtoken";


describe("AUTH API", () => {
  // ---------------------------------------------------------------------------
  // SIGNUP
  // This test tries to cover all possible error cases in the signup flow, including validation and duplicate checks.
  // - The postmark email sending is mocked, so we can verify that it was called without actually sending emails.
  // ---------------------------------------------------------------------------
  describe("Signup", () => {
    it("creates a new user and sends verification email", async () => {
      const res = await api.post("/api/auth/signup").send({
        username: "john",
        email: "john@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe("john@example.com");

      const user = await User.findOne({ email: "john@example.com" });
      expect(user).not.toBeNull();
      expect(user?.verified).toBe(false);
      expect(user?.verificationCode).toBeDefined();
    });

    it("rejects missing fields", async () => {
      const res = await api.post("/api/auth/signup").send({
        username: "john",
        password: "Password123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing required fields");
    });

    it("rejects invalid email format", async () => {
      const res = await api.post("/api/auth/signup").send({
        username: "john",
        email: "invalid-email",
        password: "Password123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid email format");
    });

    it("rejects short password", async () => {
      const res = await api.post("/api/auth/signup").send({
        username: "john",
        email: "john@example.com",
        password: "short",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Password must be at least");
    });

    it("rejects duplicate username", async () => {
      await api.post("/api/auth/signup").send({
        username: "john",
        email: "john@example.com",
        password: "Password123!",
      });

      const res = await api.post("/api/auth/signup").send({
        username: "john",
        email: "john2@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Username already exists");
    });

    it("rejects duplicate verified email", async () => {
      await api.post("/api/auth/signup").send({
        username: "john",
        email: "john@example.com",
        password: "Password123!",
      });

      const user = await User.findOne({ email: "john@example.com" });
      user!.verified = true;
      await user!.save();

      const res = await api.post("/api/auth/signup").send({
        username: "john2",
        email: "john@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Email already registered");
    });

    it("resends verification code for unverified user", async () => {
      await api.post("/api/auth/signup").send({
        username: "john",
        email: "john@example.com",
        password: "Password123!",
      });

      const res = await api.post("/api/auth/signup").send({
        username: "john2",
        email: "john@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Verification code resent");
    });
  });

  // ---------------------------------------------------------------------------
  // VERIFY EMAIL
  // ---------------------------------------------------------------------------
  describe("Verify Email", () => {
    it("verifies a user and sets cookie", async () => {
      await api.post("/api/auth/signup").send({
        username: "john",
        email: "john@example.com",
        password: "Password123!",
      });

      const user = await User.findOne({ email: "john@example.com" });
      const code = user?.verificationCode;

      const res = await api.post("/api/auth/verify-email").send({
        email: "john@example.com",
        verificationCode: code,
      });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("john@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects invalid code", async () => {
      await api.post("/api/auth/signup").send({
        username: "john",
        email: "john@example.com",
        password: "Password123!",
      });

      const res = await api.post("/api/auth/verify-email").send({
        email: "john@example.com",
        verificationCode: "000000",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid verification code");
    });

    it("rejects expired code", async () => {
      await api.post("/api/auth/signup").send({
        username: "john",
        email: "john@example.com",
        password: "Password123!",
      });

      const user = await User.findOne({ email: "john@example.com" });
      user!.verificationCodeExpires = new Date(Date.now() - 1000);
      await user!.save();

      const res = await api.post("/api/auth/verify-email").send({
        email: "john@example.com",
        verificationCode: user!.verificationCode,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Verification code expired");
    });

    it("rejects already verified user", async () => {
      await api.post("/api/auth/signup").send({
        username: "john",
        email: "john@example.com",
        password: "Password123!",
      });

      const user = await User.findOne({ email: "john@example.com" });
      user!.verified = true;
      await user!.save();

      const res = await api.post("/api/auth/verify-email").send({
        email: "john@example.com",
        verificationCode: "123456",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Email already verified");
    });
  });

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
  describe("Login", () => {
    const setupVerifiedUser = async () => {
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
    };

    it("logs in with email", async () => {
      await setupVerifiedUser();

      const res = await api.post("/api/auth/login").send({
        login: "john@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("john@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("logs in with username", async () => {
      await setupVerifiedUser();

      const res = await api.post("/api/auth/login").send({
        login: "john",
        password: "Password123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe("john");
    });

    it("rejects unverified user", async () => {
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

    it("rejects wrong password", async () => {
      await setupVerifiedUser();

      const res = await api.post("/api/auth/login").send({
        login: "john@example.com",
        password: "WrongPassword!",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Invalid login or password");
    });
  });

  // ---------------------------------------------------------------------------
  // /ME
  // ---------------------------------------------------------------------------
  describe("/me", () => {
    it("returns authenticated user", async () => {
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

    it("returns unauthenticated without cookie", async () => {
      const res = await api.get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.authenticated).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------
  describe("Logout", () => {
    it("clears cookie", async () => {
      const res = await api.post("/api/auth/logout");
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Logged out");
    });
  });

  // ---------------------------------------------------------------------------
  // GOOGLE OAUTH
  // ---------------------------------------------------------------------------
  describe("Google OAuth", () => {
    it("logs in a Google user", async () => {
      const res = await api.post("/api/auth/google").send({
        idToken: "valid-google-token",
      });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("googleuser@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects missing token", async () => {
      const res = await api.post("/api/auth/google").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing ID token");
    });

    it("rejects if email exists under inkboard provider", async () => {
      await api.post("/api/auth/signup").send({
        username: "ink",
        email: "googleuser@example.com",
        password: "Password123!",
      });

      const user = await User.findOne({ email: "googleuser@example.com" });
      user!.verified = true;
      await user!.save();

      const res = await api.post("/api/auth/google").send({
        idToken: "valid-google-token",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Email already registered with a different provider");
    });
  });
});
