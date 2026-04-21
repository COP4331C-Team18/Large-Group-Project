import { api, User } from "./setup";

describe("USERS API", () => {
  // ---------------------------------------------------------------------------
  // GET ALL USERS
  // ---------------------------------------------------------------------------
  describe("GET /api/users", () => {
    it("returns an empty list when no users exist", async () => {
      const res = await api.get("/api/users");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns all users (excluding passwords)", async () => {
      await User.create({
        username: "john",
        email: "john@example.com",
        password: "hashed",
        provider: "inkboard",
        verified: true,
      });

      await User.create({
        username: "mary",
        email: "mary@example.com",
        password: "hashed",
        provider: "inkboard",
        verified: true,
      });

      const res = await api.get("/api/users");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].password).toBeUndefined();
      expect(res.body[1].password).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // GET USER BY ID
  // ---------------------------------------------------------------------------
  describe("GET /api/users/:id", () => {
    it("returns a user by ID", async () => {
      const user = await User.create({
        username: "john",
        email: "john@example.com",
        password: "hashed",
        provider: "inkboard",
        verified: true,
      });

      const res = await api.get(`/api/users/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe("john");
      expect(res.body.password).toBeUndefined();
    });

    it("returns 404 for non‑existent user", async () => {
      const fakeId = "64b0c9f4f4f4f4f4f4f4f4f4";

      const res = await api.get(`/api/users/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("returns 400 for invalid ID format", async () => {
      const res = await api.get("/api/users/invalid-id");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid user ID");
    });
  });

  // ---------------------------------------------------------------------------
  // UPDATE USERNAME
  // ---------------------------------------------------------------------------
  describe("PUT /api/users/:id/username", () => {
    it("updates a user's username", async () => {
      const user = await User.create({
        username: "john",
        email: "john@example.com",
        password: "hashed",
        provider: "inkboard",
        verified: true,
      });

      const res = await api
        .put(`/api/users/${user._id}/username`)
        .send({ username: "newjohn" });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe("newjohn");
    });

    it("rejects missing username", async () => {
      const user = await User.create({
        username: "john",
        email: "john@example.com",
        password: "hashed",
        provider: "inkboard",
        verified: true,
      });

      const res = await api.put(`/api/users/${user._id}/username`).send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username is required");
    });

    it("rejects duplicate username", async () => {
      await User.create({
        username: "existing",
        email: "existing@example.com",
        password: "hashed",
        provider: "inkboard",
        verified: true,
      });

      const user = await User.create({
        username: "john",
        email: "john@example.com",
        password: "hashed",
        provider: "inkboard",
        verified: true,
      });

      const res = await api
        .put(`/api/users/${user._id}/username`)
        .send({ username: "existing" });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("Username already taken");
    });

    it("returns 404 when updating non‑existent user", async () => {
      const fakeId = "64b0c9f4f4f4f4f4f4f4f4f4";

      const res = await api
        .put(`/api/users/${fakeId}/username`)
        .send({ username: "newname" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("returns 400 for invalid ID format", async () => {
      const res = await api
        .put("/api/users/invalid-id/username")
        .send({ username: "newname" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid user ID");
    });
  });

  // ---------------------------------------------------------------------------
  // UPDATE PASSWORD
  // ---------------------------------------------------------------------------
  describe("PUT /api/users/:id/password", () => {
    it("updates password when current password is correct", async () => {
      const user = await User.create({
        username: "john",
        email: "john@example.com",
        password: "oldpass123",
        provider: "inkboard",
        verified: true,
      });

      const res = await api
        .put(`/api/users/${user._id}/password`)
        .send({ currentPassword: "oldpass123", newPassword: "newpass456" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Password updated successfully");

      const updated = await User.findById(user._id);
      const matches = await updated!.comparePassword("newpass456");
      expect(matches).toBe(true);
    });

    it("rejects incorrect current password", async () => {
      const user = await User.create({
        username: "john",
        email: "john@example.com",
        password: "correctpass",
        provider: "inkboard",
        verified: true,
      });

      const res = await api
        .put(`/api/users/${user._id}/password`)
        .send({ currentPassword: "wrongpass", newPassword: "newpass" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Current password is incorrect");
    });

    it("returns 404 when updating password for non‑existent user", async () => {
      const fakeId = "64b0c9f4f4f4f4f4f4f4f4f4";

      const res = await api
        .put(`/api/users/${fakeId}/password`)
        .send({ currentPassword: "old", newPassword: "new" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("returns 500 when missing fields", async () => {
      const user = await User.create({
        username: "john",
        email: "john@example.com",
        password: "oldpass",
        provider: "inkboard",
        verified: true,
      });

      const res = await api
        .put(`/api/users/${user._id}/password`)
        .send({});

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Error updating password");
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE USER
  // ---------------------------------------------------------------------------
  describe("DELETE /api/users/:id", () => {
    it("deletes a user", async () => {
      const user = await User.create({
        username: "john",
        email: "john@example.com",
        password: "hashed",
        provider: "inkboard",
        verified: true,
      });

      const res = await api.delete(`/api/users/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("User deleted");

      const deleted = await User.findById(user._id);
      expect(deleted).toBeNull();
    });

    it("returns 404 when deleting non‑existent user", async () => {
      const fakeId = "64b0c9f4f4f4f4f4f4f4f4f4";

      const res = await api.delete(`/api/users/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("returns 400 for invalid ID format", async () => {
      const res = await api.delete("/api/users/invalid-id");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid user ID");
    });
  });
});
