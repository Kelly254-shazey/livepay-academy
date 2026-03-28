import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

import { REQUEST_ID_HEADER } from "../constants/domain";

type RequestContextStore = {
  requestId: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = req.header(REQUEST_ID_HEADER) ?? randomUUID();
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  requestContextStorage.run({ requestId }, () => {
    next();
  });
}

export function getRequestContext() {
  return requestContextStorage.getStore();
}
