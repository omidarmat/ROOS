const appError = require('./../utils/appError');

const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: '🔴 Error',
      message: err.message,
    });
  }
  console.log('🔺', err);
  res.status(500).json({
    status: '🔴 Error',
    message: 'Some unexpected error happened.',
  });
};

const handleJWTError = () => new appError('Invalid JWT. Please log in', 403);

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || '🔴 Error';
  console.log('🔺', err);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    sendErrorProd(err, req, res);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    err,
  });
};

module.exports = globalErrorHandler;
