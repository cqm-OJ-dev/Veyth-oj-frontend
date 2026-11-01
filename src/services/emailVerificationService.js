import axios from "axios";

const MAIL_SERVER_URL = "https://mailserver.cqiming.com/api/batch_mail/api/send";
const CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const RANDOM_BYTE_LIMIT = Math.floor(256 / CODE_CHARACTERS.length) * CODE_CHARACTERS.length;

export function generateVerificationCode() {
  const cryptoProvider = typeof window !== "undefined" ? window.crypto : null;
  if (!cryptoProvider || typeof cryptoProvider.getRandomValues !== "function") {
    throw new Error("当前浏览器不支持安全的验证码生成");
  }

  const randomBytes = new Uint8Array(16);

  while (true) {
    const code = [];
    while (code.length < 6) {
      cryptoProvider.getRandomValues(randomBytes);
      for (const byte of randomBytes) {
        if (byte < RANDOM_BYTE_LIMIT) {
          code.push(CODE_CHARACTERS[byte % CODE_CHARACTERS.length]);
          if (code.length === 6) break;
        }
      }
    }

    const value = code.join("");
    if (/[A-Za-z]/.test(value) && /[0-9]/.test(value)) {
      return value;
    }
  }
}

export async function sendVerificationEmail(recipient, code) {
  const apiKey = (process.env.REACT_APP_MAILSERVER_API_KEY || "").trim();
  const allowKeylessAccess = process.env.REACT_APP_MAILSERVER_ALLOW_NO_API_KEY === "true";

  if (!apiKey && !allowKeylessAccess) {
    throw new Error(
      "邮箱验证服务未配置。请提供受限的公开客户端密钥，或确认邮件服务支持免密浏览器调用后启用免密配置。"
    );
  }

  const headers = {
    "Content-Type": "application/json"
  };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return axios.post(
    MAIL_SERVER_URL,
    {
      sender: "verify@verify.cqiming.com",
      recipient,
      attribs: {
        code
      }
    },
    { headers }
  );
}
