export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200
    ? res.statusCode
    : 500;

  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    status: "error",
    message: statusCode === 500
      ? "Internal Server Error"
      : err.message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};
