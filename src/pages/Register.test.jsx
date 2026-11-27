import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Register from "./Register";
import { LanguageProvider } from "../context/languageContext";
import { generateVerificationCode, sendVerificationEmail } from "../services/emailVerificationService";

jest.mock("axios", () => ({
  post: jest.fn()
}));
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn()
}), { virtual: true });
jest.mock("../services/authService", () => ({
  API_BASE: "https://api.example.com"
}));
jest.mock("../services/emailVerificationService", () => ({
  generateVerificationCode: jest.fn(),
  sendVerificationEmail: jest.fn()
}));

const axios = require("axios");

describe("Register", () => {
  beforeEach(() => {
    window.localStorage.setItem("veyth-language", "zh");
    generateVerificationCode.mockReturnValue("Ab12Cd");
    sendVerificationEmail.mockResolvedValue({ status: 200 });
    axios.post.mockResolvedValue({ status: 201 });
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.removeItem("veyth-language");
  });

  const renderRegister = () => render(
    <LanguageProvider>
      <Register />
    </LanguageProvider>
  );

  test("sends a code and registers only after the entered code matches", async () => {
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText("用户名"), {
      target: { value: "test-user" }
    });
    fireEvent.change(screen.getByPlaceholderText("邮箱"), {
      target: { value: "user@example.com" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }));

    await waitFor(() => {
      expect(sendVerificationEmail).toHaveBeenCalledWith("user@example.com", "Ab12Cd");
    });
    expect(await screen.findByText("验证码已发送，请查收邮件。")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("邮箱验证码"), {
      target: { value: "wrong1" }
    });
    fireEvent.change(screen.getByPlaceholderText("密码"), {
      target: { value: "password" }
    });
    fireEvent.change(screen.getByPlaceholderText("确认密码"), {
      target: { value: "password" }
    });
    fireEvent.click(screen.getByRole("button", { name: "注册" }));

    expect(await screen.findByText("邮箱验证码不正确")).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("邮箱验证码"), {
      target: { value: "Ab12Cd" }
    });
    fireEvent.click(screen.getByRole("button", { name: "注册" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "https://api.example.com/api/auth/register/",
        {
          username: "test-user",
          email: "user@example.com",
          password: "password"
        },
        { headers: { "Content-Type": "application/json" } }
      );
    });
  });

  test("does not register before a verification code is sent", async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText("邮箱"), {
      target: { value: "user@example.com" }
    });
    fireEvent.change(screen.getByPlaceholderText("密码"), {
      target: { value: "password" }
    });
    fireEvent.change(screen.getByPlaceholderText("确认密码"), {
      target: { value: "password" }
    });
    fireEvent.click(screen.getByRole("button", { name: "注册" }));

    expect(await screen.findByText("请输入邮箱验证码。")).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
