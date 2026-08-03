import { AsyncLocalStorage } from "node:async_hooks";
import { RequestContext } from "../../express/types";
import jwt from "jsonwebtoken";
import { env } from "../env";

export function expiresIn(minutes: number) {
  const now = new Date().getTime();
  return new Date(now + minutes * 60000).getTime();
}

export function generateJWT(data: Record<string, string>): string {
  const token = jwt.sign(data, env.ENCRYPTION_KEY, {
    algorithm: "HS256",
    expiresIn: "7d",
  });

  return token;
}

export function decodeJWT(token: string) {
  try {
    const decoded = jwt.verify(token, env.ENCRYPTION_KEY);
    return decoded;
  } catch (error) {
    return null;
  }
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = () => {
  return requestContext.getStore();
};
