import { HandlerConfiguration } from "./types";

function expressHandler(handlerConfiguration: HandlerConfiguration) {
  return {
    path: handlerConfiguration.path,
    method: handlerConfiguration.method,
    middlewares: handlerConfiguration.middlewares,
    props: handlerConfiguration.props,
    handler: handlerConfiguration.handler,
    onResponseEnd: handlerConfiguration.onResponseEnd,
  };
}

export default expressHandler;
