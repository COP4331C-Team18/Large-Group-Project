import { api, User, Board } from "./setup";

// Helper: signup → verify → login → return cookie
const signupVerifyLogin = async (username: string, email: string, password: string) => {
  await api.post("/api/auth/signup").send({ username, email, password });

  const user = await User.findOne({ email });
  const code = user?.verificationCode;

  await api.post("/api/auth/verify-email").send({
    email,
    verificationCode: code,
  });

  const loginRes = await api.post("/api/auth/login").send({
    login: email,
    password,
  });

  return loginRes.headers["set-cookie"];
};

describe("BOARDS API", () => {
  // ---------------------------------------------------------------------------
  // CREATE BOARD
  // ---------------------------------------------------------------------------
  describe("Create Board", () => {
    it("creates a board for the authenticated user", async () => {
      const cookie = await signupVerifyLogin("john", "john@example.com", "Password123!");

      const res = await api
        .post("/api/boards")
        .set("Cookie", cookie)
        .send({ title: "My Board", description: "Test board", category: "General" });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("My Board");
      expect(res.body.owner).toBeDefined();
      expect(res.body.joinCode).toBeUndefined(); // joinCode is no longer auto-generated
    });

    it("rejects creation when not authenticated", async () => {
      const res = await api.post("/api/boards").send({ title: "No Auth Board" });

      expect(res.status).toBe(401);
      expect(res.body.authenticated).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);
    });
  });

  // ---------------------------------------------------------------------------
  // GET MY BOARDS
  // ---------------------------------------------------------------------------
  describe("Get My Boards", () => {
    it("returns only boards owned by the authenticated user", async () => {
      const cookie = await signupVerifyLogin("john", "john@example.com", "Password123!");

      await api.post("/api/boards").set("Cookie", cookie).send({ title: "Board 1" });
      await api.post("/api/boards").set("Cookie", cookie).send({ title: "Board 2" });

      const res = await api.get("/api/boards").set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("rejects fetching boards when not authenticated", async () => {
      const res = await api.get("/api/boards");

      expect(res.status).toBe(401);
      expect(res.body.authenticated).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);

    });
  });

  // ---------------------------------------------------------------------------
  // GET BOARD BY ID
  // ---------------------------------------------------------------------------
  describe("Get Board By ID", () => {
    it("returns a board owned by the authenticated user", async () => {
      const cookie = await signupVerifyLogin("john", "john@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookie).send({ title: "Board A" });
      const boardId = created.body._id;

      const res = await api.get(`/api/boards/${boardId}`).set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Board A");
    });

    it("rejects fetching a board not owned by the user", async () => {
      const cookieA = await signupVerifyLogin("john", "john@example.com", "Password123!");
      const cookieB = await signupVerifyLogin("mary", "mary@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookieA).send({ title: "Private Board" });
      const boardId = created.body._id;

      const res = await api.get(`/api/boards/${boardId}`).set("Cookie", cookieB);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Board not found or unauthorized");
    });

    it("rejects fetching when not authenticated", async () => {
      const res = await api.get("/api/boards/123");

      expect(res.status).toBe(401);
      expect(res.body.authenticated).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);

    });
  });

  // ---------------------------------------------------------------------------
  // SET BOARD JOIN CODE
  // ---------------------------------------------------------------------------
  describe("Set Board Join Code", () => {
    it("sets a valid join code for a board", async () => {
      const cookie = await signupVerifyLogin("john", "john@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookie).send({ title: "Joinable" });
      const boardId = created.body._id;

      const res = await api
        .post(`/api/boards/${boardId}/joinCode`)
        .set("Cookie", cookie)
        .send({ joinCode: "A1B2C3" });

      expect(res.status).toBe(200);
      expect(res.body.joinCode).toBe("A1B2C3");
    });

    it("rejects invalid join code format", async () => {
      const cookie = await signupVerifyLogin("john", "john@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookie).send({ title: "Bad Code Board" });
      const boardId = created.body._id;

      const res = await api
        .post(`/api/boards/${boardId}/joinCode`)
        .set("Cookie", cookie)
        .send({ joinCode: "ZZZZZZZ" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Join code must be a 6-character hex code");
    });

    it("rejects setting join code on a board not owned by the user", async () => {
      const cookieA = await signupVerifyLogin("john", "john@example.com", "Password123!");
      const cookieB = await signupVerifyLogin("mary", "mary@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookieA).send({ title: "Private" });
      const boardId = created.body._id;

      const res = await api
        .post(`/api/boards/${boardId}/joinCode`)
        .set("Cookie", cookieB)
        .send({ joinCode: "A1B2C3" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Board not found or unauthorized");
    });
  });

  // ---------------------------------------------------------------------------
  // JOIN BOARD BY CODE
  // ---------------------------------------------------------------------------
  describe("Join Board by Code", () => {
    it("joins a board using its join code", async () => {
      const cookie = await signupVerifyLogin("john", "john@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookie).send({ title: "Joinable Board" });
      const boardId = created.body._id;

      await api
        .post(`/api/boards/${boardId}/joinCode`)
        .set("Cookie", cookie)
        .send({ joinCode: "A1B2C3" });

      const res = await api.get(`/api/boards/join/A1B2C3`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Joinable Board");
    });

    it("returns 404 for invalid join code", async () => {
      const res = await api.get("/api/boards/join/FFFFFF");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Invalid room code.");
    });
  });

  // ---------------------------------------------------------------------------
  // UPDATE BOARD
  // ---------------------------------------------------------------------------
  describe("Update Board", () => {
    it("updates a board owned by the authenticated user", async () => {
      const cookie = await signupVerifyLogin("john", "john@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookie).send({ title: "Original Title" });
      const boardId = created.body._id;

      const res = await api
        .put(`/api/boards/${boardId}`)
        .set("Cookie", cookie)
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
    });

    it("rejects updating a board not owned by the user", async () => {
      const cookieA = await signupVerifyLogin("john", "john@example.com", "Password123!");
      const cookieB = await signupVerifyLogin("mary", "mary@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookieA).send({ title: "User A Board" });
      const boardId = created.body._id;

      const res = await api
        .put(`/api/boards/${boardId}`)
        .set("Cookie", cookieB)
        .send({ title: "Hacked Title" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Board not found or unauthorized");
    });

    it("rejects update when not authenticated", async () => {
      const res = await api.put("/api/boards/123").send({ title: "No Auth" });

      expect(res.status).toBe(401);
      expect(res.body.authenticated).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);

    });
  });

  // ---------------------------------------------------------------------------
  // DELETE BOARD
  // ---------------------------------------------------------------------------
  describe("Delete Board", () => {
    it("deletes a board owned by the authenticated user", async () => {
      const cookie = await signupVerifyLogin("john", "john@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookie).send({ title: "Board to Delete" });
      const boardId = created.body._id;

      const res = await api.delete(`/api/boards/${boardId}`).set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Board deleted successfully");
    });

    it("rejects deleting a board not owned by the user", async () => {
      const cookieA = await signupVerifyLogin("john", "john@example.com", "Password123!");
      const cookieB = await signupVerifyLogin("mary", "mary@example.com", "Password123!");

      const created = await api.post("/api/boards").set("Cookie", cookieA).send({ title: "User A Board" });
      const boardId = created.body._id;

      const res = await api.delete(`/api/boards/${boardId}`).set("Cookie", cookieB);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Board not found or unauthorized");
    });

    it("rejects delete when not authenticated", async () => {
      const res = await api.delete("/api/boards/123");

      expect(res.status).toBe(401);
      expect(res.body.authenticated).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);

    });
  });
});
