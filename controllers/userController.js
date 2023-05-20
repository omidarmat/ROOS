const asyncWrapper = require('../utils/asyncWrapper');
const appError = require('./../utils/appError');
const filterBody = require('./../utils/filterBody');
const User = require('./../models/userModel');
const queryManager = require('./../utils/queryManager');

exports.getAllUsers = asyncWrapper(async (req, res) => {
  const users = await queryManager(User, req.query);

  res.status(200).json({
    status: '🟢 Success',
    message: 'All user documents retrieved successfully.',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({
    status: '🟢 Success',
    message: 'User document matched.',
    data: {
      user,
    },
  });
});

exports.createUser = asyncWrapper(async (req, res) => {
  const newUser = await User.create(req.body);

  res.status(200).json({
    status: '🟢 Success',
    message: 'User document created successfully.',
    data: {
      newUser,
    },
  });
});

exports.updateUser = asyncWrapper(async (req, res, next) => {
  if (req.body.password)
    return next(
      new appError('Admins are not allowed to manipulate user passwords.', 403)
    );

  if (req.body.locations)
    return next(new appError('Cannot use this route to edit locations.', 403));

  const user = await User.findById(req.params.id);

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

exports.updateMe = asyncWrapper(async (req, res, next) => {
  if (req.body.password)
    return next(
      new appError('Cannot use this route to update your password.', 403)
    );

  if (req.body.locations)
    return next(new appError('Cannot use this route to edit locations.', 403));

  const user = await User.findById(req.user._id);

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
  console.log('🟢🟢 Current password check passed');
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
