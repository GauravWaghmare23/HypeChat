import { httpRequestCounter, httpRequestDuration } from "../utils/metrics.js";

export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.originalUrl,
      status: res.statusCode,
    });

    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.originalUrl,
      status: res.statusCode,
    }, duration);
  });

  next();
};
