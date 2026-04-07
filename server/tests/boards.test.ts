import { api, User, Board } from "./setup";

const signupVerifyAndLogin = async (username: string, email: string, password: string) => {
  // Signup
  await api.post("/api/auth/signup").send({
    username,
    email,
    password,
  });

  // Get verification code from DB
  const user = await User.findOne({ email });
  const verificationCode = user?.verificationCode;

  // Verify email
  await api.post("/api/auth/verify-email").send({
    email,
    verificationCode,
  });

  // Login
  const loginRes = await api.post("/api/auth/login").send({
    login: email,
    password,
  });

  return loginRes.headers["set-cookie"];
};

describe("Boards API", () => {
  it("should create a board", async () => {
    const cookie = await signupVerifyAndLogin("john", "john@example.com", "password123");

    const res = await api
      .post("/api/boards")
      .set("Cookie", cookie)
      .send({ title: "My Board" });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("My Board");
    expect(res.body.joinCode).toBeDefined();
  });

  it("should fetch user boards", async () => {
    const cookie = await signupVerifyAndLogin("john", "john@example.com", "password123");

    await api.post("/api/boards").set("Cookie", cookie).send({ title: "Board 1" });
    await api.post("/api/boards").set("Cookie", cookie).send({ title: "Board 2" });

    const res = await api.get("/api/boards").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].title).toMatch(/Board [1-2]/);
  });

  it("should join a board by code", async () => {
    const cookie = await signupVerifyAndLogin("john", "john@example.com", "password123");

    const created = await api
      .post("/api/boards")
      .set("Cookie", cookie)
      .send({ title: "Joinable Board" });

    const joinCode = created.body.joinCode;

    const res = await api.get(`/api/boards/join/${joinCode}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Joinable Board");
  });

  it("should update a board", async () => {
    const cookie = await signupVerifyAndLogin("john", "john@example.com", "password123");

    const created = await api
      .post("/api/boards")
      .set("Cookie", cookie)
      .send({ title: "Original Title" });

    const boardId = created.body._id;

    const res = await api
      .put(`/api/boards/${boardId}`)
      .set("Cookie", cookie)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Title");
  });

  it("should delete a board", async () => {
    const cookie = await signupVerifyAndLogin("john", "john@example.com", "password123");

    const created = await api
      .post("/api/boards")
      .set("Cookie", cookie)
      .send({ title: "Board to Delete" });

    const boardId = created.body._id;

    const res = await api.delete(`/api/boards/${boardId}`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("deleted successfully");
  });
});