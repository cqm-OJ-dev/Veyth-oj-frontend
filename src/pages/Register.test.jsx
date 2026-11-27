import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Register from "./Register";
import { LanguageProvider } from "../context/languageContext";
import { sendVerificationEmail } from "../services/emailVerificationService";

jest.mock("axios", () => ({
  post: jest.fn()
}));
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn()
}), { virtual: true });
jest.mock("../services/authService", () => ({
  API_BASE: "https://api.example.com/"
}));
jest.mock("../services/emailVerificationService", () => ({
  sendVerificationEmail: jest.fn()
}));

const axios = require("axios");

describe("Register", () => {
  beforeEach(() => {
    window.localStorage.setItem("veyth-language", "zh");
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

  test("requests a code and submits the entered code to registration", async () => {
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText("用户名"), {
      target: { value: "test-user" }
    });
    fireEvent.change(screen.getByPlaceholderText("邮箱"), {
      target: { value: "user@example.com" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }));

    await waitFor(() => {
      expect(sendVerificationEmail).toHaveBeenCalledWith("user@example.com");
    });
    expect(await screen.findByText(/验证码发送较慢，请耐心等待1~2分钟/)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("密码"), {
      target: { value: "password" }
    });
    fireEvent.change(screen.getByPlaceholderText("确认密码"), {
      target: { value: "password" }
    });
    fireEvent.click(screen.getByRole("button", { name: "注册" }));

    expect(await screen.findByText("请输入邮箱验证码。")).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalledWith(
      "https://api.example.com/api/auth/register/",
      expect.anything(),
      expect.anything()
    );

    fireEvent.change(screen.getByPlaceholderText("邮箱验证码"), {
      target: { value: "123456" }
    });
    fireEvent.click(screen.getByRole("button", { name: "注册" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "https://api.example.com/api/auth/register/",
        {
          username: "test-user",
          email: "user@example.com",
          password: "password",
          verification_code: "123456"
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

  test("rejects a verification code that is not six digits", async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText("邮箱"), {
      target: { value: "user@example.com" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }));
    await waitFor(() => expect(sendVerificationEmail).toHaveBeenCalled());
    fireEvent.change(screen.getByPlaceholderText("邮箱验证码"), {
      target: { value: "12345" }
    });
    fireEvent.click(screen.getByRole("button", { name: "注册" }));
    expect(await screen.findByText("请输入6位邮箱验证码。")).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalledWith(
      "https://api.example.com/api/auth/register/",
      expect.anything(),
      expect.anything()
    );
  });
});
