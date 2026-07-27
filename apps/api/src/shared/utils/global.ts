import { AsyncLocalStorage } from "node:async_hooks";
import { RequestContext } from "../../express/types";

export function expiresIn(minutes: number) {
  const now = new Date().getTime();
  return new Date(now + minutes * 60000).getTime();
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = () => {
  return requestContext.getStore();
};
