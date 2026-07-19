// Global Error Handler Middleware
export const errorHandler = (err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server!'
  });
};
