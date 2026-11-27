import { sendVerificationEmail } from "./emailVerificationService";

jest.mock("axios", () => ({
  post: jest.fn()
}));
jest.mock("./authService", () => ({
  API_BASE: "https://api.example.com/"
}));

const axios = require("axios");

describe("email verification service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("requests an email verification code from the backend", async () => {
    axios.post.mockResolvedValue({ status: 200 });

    await sendVerificationEmail("user@example.com");

    expect(axios.post).toHaveBeenCalledWith(
      "https://api.example.com/api/auth/email-verification/send/",
      { email: "user@example.com" },
      { headers: { "Content-Type": "application/json" } }
    );
  });
});
