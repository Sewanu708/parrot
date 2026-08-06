'use client'
import { QueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { isParrotErrorInstance } from "./utilities";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isParrotErrorInstance(error)) {
          if (error.publicCode == "SL07" || error.publicCode == "SL08")
            return false;
          // deterministic errors
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 3;
      },
      staleTime: 30_000,
    },
    mutations: {
      onError: (error) => {
        if (
          isParrotErrorInstance(error) &&
          (error.publicCode == "SL07" || error.publicCode == "SL08")
        ) {
          signOut({ callbackUrl: "/auth/login" });
        }
      },
    },
  },
});

export default queryClient