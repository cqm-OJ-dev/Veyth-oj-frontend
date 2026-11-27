import axios from "axios";
import { API_BASE } from "./authService";

const API_ROOT = API_BASE.replace(/\/+$/, "");

export async function sendVerificationEmail(email) {
  return axios.post(
    `${API_ROOT}/api/auth/email-verification/send/`,
    { email },
    { headers: { "Content-Type": "application/json" } }
  );
}
