import { generateVerificationCode, sendVerificationEmail } from "./emailVerificationService";

jest.mock("axios", () => ({
  post: jest.fn()
}));

const axios = require("axios");

describe("email verification service", () => {
  afterEach(() => {
    delete process.env.REACT_APP_MAILSERVER_API_KEY;
    delete process.env.REACT_APP_MAILSERVER_ALLOW_NO_API_KEY;
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

  test("sends the code directly to the mail server with the configured client key", async () => {
    process.env.REACT_APP_MAILSERVER_API_KEY = "restricted-public-test-key";
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
          "x-api-key": "restricted-public-test-key"
        }
      }
    );
  });

  test("supports explicitly configured keyless access", async () => {
    process.env.REACT_APP_MAILSERVER_ALLOW_NO_API_KEY = "true";
    axios.post.mockResolvedValue({ status: 200 });

    await sendVerificationEmail("user@example.com", "Ab12Cd");

    expect(axios.post.mock.calls[0][2].headers).toEqual({
      "Content-Type": "application/json"
    });
  });

  test("fails explicitly when neither client credentials nor keyless access is configured", async () => {
    await expect(sendVerificationEmail("user@example.com", "Ab12Cd")).rejects.toThrow(
      "邮箱验证服务未配置"
    );
    expect(axios.post).not.toHaveBeenCalled();
  });
});
