// CUSTOM MODULES
const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsErrorDB = err => {
  const entries = Object.entries(err.keyValue).reduce((acc, entry) => acc + entry.join(': '), '');
  const message = `Duplicate field value(s): ${entries}`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors)
    .map(error => error.message)
    .join('. ');
  const message = `Invalid input data ${errors}`;

  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please login again!', 401);

const handleJWTExpiredError = () => new AppError('Token expired! Please login again.', 401);

const sendErrorDev = (err, req, res) => {
  // FOR API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else {
    // FOR RENDERED WEBSITE
    console.error('Error 💥', err);
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong!', message: err.message });
  }
};

const sendErrorProd = (err, req, res) => {
  // FOR API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming or other unknown error: don't leak error details
      // 1) Log error
      console.error('Error 💥', err);

      // 2) Send generic message
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong :(',
      });
    }
  } else {
    // FOR RENDERED WEBSITE
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res
        .status(err.statusCode)
        .render('error', { title: 'Something went wrong!', message: err.message });
    } else {
      // Programming or other unknown error: don't leak error details
      // 1) Log error
      console.error('Error 💥', err);

      // 2) Send generic message
      return res
        .status(err.statusCode)
        .render('error', { title: 'Something went wrong!', message: 'Please try again later.' });
    }
  }
};

// It's a global error handler function which express.js recognize because of it's function signature (4 parameters, starts with err)
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);

    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    if (err.code === 11000) {
      error = handleDuplicateFieldsErrorDB(error);
    }

    sendErrorProd(error, req, res);
  }
};
