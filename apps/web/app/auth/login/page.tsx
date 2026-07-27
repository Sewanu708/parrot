export const metadata: Metadata = {
  title: "Login",
};

import LoginPage from "@/components/auth/login";
import { Metadata } from "next";

export default function Login() {
  return <LoginPage />;
}
