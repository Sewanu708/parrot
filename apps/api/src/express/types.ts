import { IncomingHttpHeaders } from "http";

// ──────────────────────────────────────────────
//  HTTP method type
// ──────────────────────────────────────────────

export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head";

// ──────────────────────────────────────────────
//  Request types
// ──────────────────────────────────────────────

export type RequestProperties = {
  IP: string | null;
  baseURL: string;
  method: HttpMethod;
  requestURL: string;
  requestURLWithoutQueryStrings: string;
  handlerPath: string;
  hostname: string;
  userAgent: string;
};

export type RequestComponents = {
  body: any;
  query: Record<string, string>;
  headers: IncomingHttpHeaders;
  params: Record<string, string>;
  meta: Record<string, any>;
  props: Record<string, any>;
  properties: RequestProperties;
};

export type RequestAugments = {
  body?: any;
  query?: Record<string, string>;
  headers?: IncomingHttpHeaders;
  params?: Record<string, string>;
  meta?: Record<string, any>;
};

// ──────────────────────────────────────────────
//  Handler types
// ──────────────────────────────────────────────

export type HandlerResult = {
  data?: any;
  message?: string;
  status?: number;
  endHandlerChain?: boolean;
  skipNextMiddleware?: boolean;
  skipOtherMiddlewares?: boolean;
  augments?: RequestAugments;
};

export type HandlerFunction = (
  requestComponents: RequestComponents,
  helpers: Record<string, any>,
) => HandlerResult | Promise<HandlerResult>;

// ──────────────────────────────────────────────
//  Response types
// ──────────────────────────────────────────────

export type ResponseBody = {
  status: string;
  message: string;
  data?: any;
  errors?: ErrorDetail;
  details?: string;
};

export type ErrorDetail = {
  code?: string;
  message: string;
  details?: string;
  publicCode?: string;
};

export type ResponseComponents = {
  body: ResponseBody;
  statusCode: number;
};

export type ResponseEndEventFunction = (
  requestComponents: RequestComponents,
  responseComponents: ResponseComponents,
) => void;

// ──────────────────────────────────────────────
//  Handler configuration
// ──────────────────────────────────────────────

export type HandlerConfiguration = {
  path: string;
  method: HttpMethod;
  props?: Record<string, any>;
  middlewares?: HandlerConfiguration[];
  handler: HandlerFunction;
  onResponseEnd?: ResponseEndEventFunction;
};

// ──────────────────────────────────────────────
//  Middleware execution context (internal)
// ──────────────────────────────────────────────

export type HandlerExecutionContext = {
  augments: RequestAugments;
  result: HandlerResult;
  shouldSkipNextMiddleware?: boolean;
  shouldSkipOtherMiddlewares?: boolean;
  shouldEndRequest?: boolean;
};
