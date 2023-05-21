const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const asyncWrapper = require('../utils/asyncWrapper');
const appError = require('./../utils/appError');
const User = require('./../models/userModel');
const filterBody = require('./../utils/filterBody');

const signToken = require('./../utils/signToken');
const globalCrypto = require('./../utils/globalCrypto');

const jwtVerifyPromise = (token, jwtSecret) => {
  return new Promise(function (resolve, reject) {
    jwt.verify(token, jwtSecret, function (err, decoded) {
      if (decoded) {
        resolve(decoded);
      } else {
        reject(err);
      }
    });
  });
};

// FIXME needs to handle encryption/decryption DONE
exports.signup = asyncWrapper(async (req, res) => {
  const filteredBody = filterBody(
    req.body,
    'birthday',
    'name',
    'phone',
    'password',
    'passwordConfirm'
  );

  filteredBody.name = globalCrypto.cipherize(filteredBody.name);
  filteredBody.phone = globalCrypto.cipherize(filteredBody.phone);

  const newUser = await User.create(filteredBody);

  const token = signToken(newUser._id);

  res.status(200).json({
    status: '🟢 Success',
    message: 'You have successfully signed up.',
    token,
    data: {
      newUser,
    },
  });
});

// FIXME needs to handle encryption/decryption DONE
exports.login = asyncWrapper(async (req, res, next) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return next(new appError('Please provide phone number and password.'));

  const encryptedPhone = globalCrypto.cipherize(phone);

  const user = await User.findOne({ phone: encryptedPhone }).select(
    '+password'
  );

  // check if no user or password not correct
  if (!user || !(await bcrypt.compare(password, user.password)))
    return next(
      new appError('Wrong phone number or password. Please try again.')
    );

  const token = signToken(user._id);

  res.status(200).json({
    status: '🟢 Success',
    message: 'You have logged in successfully.',
    token,
  });
});

// FIXME needs to handle encryption/decryption DONE
exports.protect = asyncWrapper(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token)
    return next(
      new appError('Please log in to get access to this route.', 401)
    );

  const decoded = await jwtVerifyPromise(token, process.env.JWT_SECRET);

  const encryptedUser = await User.findById(decoded.id);
  encryptedUser.decryptUserData('name', 'phone');

  if (!encryptedUser)
    next(
      new appError(
        'This user does not exist anymore. You are not allowed to access this route.',
        401
      )
    );

  if (
    encryptedUser.passwordChangedAt &&
    encryptedUser.passwordChangedAfterJWT(decoded.iat)
  )
    return next(
      new appError(
        'You have recently changed you password. Please log in again to get access to this route.',
        401
      )
    );

  req.user = encryptedUser;

  console.log('🟢🟢 Protection passed.');

  next();
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new appError('You are not authorized to access this route.', 403)
      );
    }
    console.log('🟢🟢 Authorization passed.');
    next();
  };
};

exports.logout = asyncWrapper(async (req, res, next) => {
  const token = '<logout-token>';
  res.status(200).json({
    status: '🟢 Success',
    massage: 'You have logged out successfully.',
    token,
  });
});
