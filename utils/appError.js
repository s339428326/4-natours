class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
    //check error is from custom
    this.isOperational = true;
    //hidden this error on stack trace print on terminal
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
