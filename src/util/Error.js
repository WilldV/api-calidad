class AppError extends Error {
    constructor(name, message, status = 500, isOperational = false) {
      super();
      Error.captureStackTrace(this, this.constructor);
      this.name = name;
      this.message = message;
      this.isOperational = isOperational;
      this.status = status;
    }
  }
  
  module.exports = AppError;