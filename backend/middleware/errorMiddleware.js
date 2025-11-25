// backend/middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  const response = {
    message: err.message || "Server Error",
  };

  // In development, you can include stack for easier debugging
  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
