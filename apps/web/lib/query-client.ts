"use client";
import { QueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import {
  AUTH_LOST_CODES,
  WORKSPACE_LOST_CODES,
  PublicErrorCode,
} from "@parrot/sdk";
import { isParrotErrorInstance } from "./utilities";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isParrotErrorInstance(error)) {
          const code = error.publicCode as PublicErrorCode;
          if (
            (code && AUTH_LOST_CODES.includes(code)) ||
            (code && WORKSPACE_LOST_CODES.includes(code))
          ) {
            if (code && AUTH_LOST_CODES.includes(code)) {
              signOut({ callbackUrl: "/auth/login" });
            } else if (
              typeof window !== "undefined" &&
              WORKSPACE_LOST_CODES.includes(code)
            ) {
              window.location.href = "/create-workspace";
            }
            return false;
          }
          // deterministic client errors (4xx)
          console.log("This is Sewanu Isaiah");
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 3;
      },
      staleTime: 30_000,
    },

    mutations: {
      onError: (error) => {
        if (isParrotErrorInstance(error)) {
          const code = error.publicCode as PublicErrorCode;
          if (code && AUTH_LOST_CODES.includes(code)) {
            signOut({ callbackUrl: "/auth/login" });
          } else if (code && WORKSPACE_LOST_CODES.includes(code)) {
            if (typeof window !== "undefined") {
              window.location.href = "/create-workspace";
            }
          }
        }
      },
    },
  },
});

export default queryClient;
