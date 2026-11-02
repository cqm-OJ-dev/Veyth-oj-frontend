import { generateVerificationCode, sendVerificationEmail } from "./emailVerificationService";

jest.mock("axios", () => ({
  post: jest.fn()
}));

const axios = require("axios");

describe("email verification service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("generates a six-character alphanumeric code", () => {
    const originalCrypto = window.crypto;
    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: {
        getRandomValues: (bytes) => {
          bytes.fill(0);
          bytes[1] = 52;
          return bytes;
        }
      }
    });

    const code = generateVerificationCode();

    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: originalCrypto
    });
    expect(code).toMatch(/^[A-Za-z0-9]{6}$/);
    expect(code).toMatch(/[A-Za-z]/);
    expect(code).toMatch(/[0-9]/);
  });

  test("sends the code directly to the mail server with its public client key", async () => {
    axios.post.mockResolvedValue({ status: 200 });

    await sendVerificationEmail("user@example.com", "Ab12Cd");

    expect(axios.post).toHaveBeenCalledWith(
      "https://mailserver.cqiming.com/api/batch_mail/api/send",
      {
        sender: "verify@verify.cqiming.com",
        recipient: "user@example.com",
        attribs: { code: "Ab12Cd" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": expect.any(String)
        }
      }
    );
  });

});
