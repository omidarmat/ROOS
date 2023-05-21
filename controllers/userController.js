const asyncWrapper = require('../utils/asyncWrapper');
const appError = require('./../utils/appError');
const filterBody = require('./../utils/filterBody');
const User = require('./../models/userModel');
const queryManager = require('./../utils/queryManager');
const crypto = require('crypto');
const signToken = require('./../utils/signToken');
const globalCrypto = require('./../utils/globalCrypto');

// FIXME needs to handle encryption/decryption DONE
// CHECKME possible decryption error BUG DONE
exports.getAllUsers = asyncWrapper(async (req, res) => {
  const encryptedUsers = await queryManager(User, req.query);

  encryptedUsers.forEach((user) => {
    return user.decryptUserData('name', 'phone');
  });

  res.status(200).json({
    status: '🟢 Success',
    message: 'All user documents retrieved successfully.',
    results: encryptedUsers.length,
    data: {
      encryptedUsers,
    },
  });
});

// FIXME needs to handle encryption/decryption DONE
// CHECKME possible decryption error BUG DONE
exports.getUser = asyncWrapper(async (req, res) => {
  const encryptedUser = await User.findById(req.params.id);

  encryptedUser.decryptUserData('name', 'phone');

  res.status(200).json({
    status: '🟢 Success',
    message: 'User document matched.',
    data: {
      encryptedUser,
    },
  });
});

// FIXME needs to handle encryption/decryption DONE
exports.createUser = asyncWrapper(async (req, res) => {
  const filteredBody = filterBody(
    req.body,
    'name',
    'phone',
    'password',
    'passwordConfirm',
    'birthday'
  );

  filteredBody.name = globalCrypto.cipherize(filteredBody.name);
  filteredBody.phone = globalCrypto.cipherize(filteredBody.phone);

  const newUser = await User.create(filteredBody);

  res.status(200).json({
    status: '🟢 Success',
    message: 'User document created successfully.',
    data: {
      newUser,
    },
  });
});

// FIXME needs to handle encryption/decryption DONE
// CHECKME possible decryption error BUG DONE
exports.updateUser = asyncWrapper(async (req, res, next) => {
  if (req.body.password)
    return next(
      new appError('Admins are not allowed to manipulate user passwords.', 403)
    );

  if (req.body.locations)
    return next(new appError('Cannot use this route to edit locations.', 403));

  const user = await User.findById(req.params.id);

  user.decryptUserData('phone', 'name');

  const filteredBody = filterBody(
    req.body,
    'birthday',
    'name',
    'phone',
    'role',
    'activeAddress'
  );

  Object.keys(filteredBody).forEach((field) => {
    user[field] = filteredBody[field];
  });

  user.encryptUserData('phone', 'name');

  await user.save();

  res.status(200).json({
    status: '🟢 Success',
    message: 'User document successfully updated.',
    data: {
      user,
    },
  });
});

exports.deleteUser = asyncWrapper(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { active: false });

  res.status(200).json({
    status: '🟢 Success',
    message: 'User document deleted successfully.',
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

// FIXME needs to handle encryption/decryption DONE
// CHECKME possible decryption error BUG DONE
exports.updateMe = asyncWrapper(async (req, res, next) => {
  if (req.body.password)
    return next(
      new appError('Cannot use this route to update your password.', 403)
    );

  if (req.body.locations)
    return next(new appError('Cannot use this route to edit locations.', 403));

  const user = await User.findById(req.user._id);
  user.decryptUserData('phone', 'name');

  const filteredBody = filterBody(
    req.body,
    'birthday',
    'name',
    'phone',
    'activeAddress'
  );

  Object.keys(filteredBody).forEach((field) => {
    user[field] = filteredBody[field];
  });

  user.encryptUserData('phone', 'name');

  await user.save();

  res.status(200).json({
    status: '🟢 Success',
    message: 'Your document updated successfully.',
    data: {
      user,
    },
  });
});

exports.deleteMe = asyncWrapper(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  const token = '<logout-token>';

  res.status(200).json({
    status: '🟢 Success',
    message: 'Your account is deleted. You are now logged out.',
    token,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateMyPassword = asyncWrapper(async (req, res, next) => {
  if (!req.body.currentPassword)
    return next(new appError('Please enter your current password.'));

  const user = await User.findById(req.user._id).select('+password');

  if (
    !(await user.currentPasswordCheck(req.body.currentPassword, user.password))
  )
    return next(new appError('Your current password is not correct.'));
  console.log('🟢🟢🟢 Current password check passed');
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  res.status(200).json({
    status: '🟢 Success',
    message: 'Password updated successfully.',
  });
});

exports.getMyLocations = (req, res) => {
  const locations = req.user.locations;
  res.status(200).json({
    status: '🟢 Success',
    message: 'Locations retrieved successfully.',
    locations,
  });
};

exports.forgotPassword = asyncWrapper(async (req, res, next) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });

  if (!user) {
    return next(new appError('There is no user with this phone number.', 404));
  }

  const token = user.createPasswordResetToken();

  await user.save();

  res.status(200).json({
    status: '🟢 Success',
    message: 'Your password reset token has been sent to your email.',
    token,
  });
});

exports.resetPassword = asyncWrapper(async (req, res, next) => {
  if (!req.headers.authorization) {
    return next(new appError('You do not have any password reset token.', 403));
  }

  const encryptedToken = crypto
    .createHash('sha256')
    .update(req.headers.authorization.split(' ')[1])
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: encryptedToken,
    // passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new appError('Invalid password reset token.', 403));
  }

  if (!user.passwordResetExpires > Date.now()) {
    return next(new appError('Expired token.', 403));
  }

  const filteredBody = filterBody(req.body, 'password', 'passwordConfirm');

  Object.keys(filteredBody).forEach((field) => {
    user[field] = filteredBody[field];
  });

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const token = signToken(user._id);

  res.status(200).json({
    status: '🟢 Success',
    message: 'Password reset complete. You are now logged in.',
    token,
  });
});
