const asyncWrapper = require('./../utils/asyncWrapper');
const filterBody = require('./../utils/filterBody');
const appError = require('./../utils/appError');
const queryManager = require('./../utils/queryManager');

const Order = require('./../models/orderModel');
const User = require('./../models/userModel');

exports.getAllOrders = asyncWrapper(async (req, res) => {
  const orders = await queryManager(Order, req.query);

  res.status(200).json({
    status: '🟢 Success',
    message: 'All order documents retrieved successfully.',
    results: orders.length,
    data: {
      orders,
    },
  });
});

exports.createOrder = asyncWrapper(async (req, res, next) => {
  if (req.user.locations.length === 0)
    return next(
      new appError(
        'You have no registered location. Please add locations in your account settings.',
        400
      )
    );

  const filteredBody = filterBody(req.body, 'items', 'amounts');

  filteredBody.user = req.user._id;

  const order = await Order.create(filteredBody);

  res.status(200).json({
    status: '🟢 Success',
    message: 'Order document created successfully.',
    order,
  });
});

exports.reviewOrder = asyncWrapper(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!req.user._id.equals(order.user._id))
    return next(
      new appError('This order is not yours. You cannot review it.', 403)
    );

  const filteredBody = filterBody(req.body, 'review', 'rating');

  Object.keys(filteredBody).forEach((field) => {
    order[field] = filteredBody[field];
  });

  order.reviewedAt = Date.now();

  await order.save();

  res.status(200).json({
    status: '🟢 Success',
    message: 'Review added to the order successfully.',
    data: {
      order,
    },
  });
});

exports.calcRatingAverage = asyncWrapper(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        allOrders: { $sum: 1 },
        ratingAverage: { $avg: '$rating' },
        minRate: { $min: '$rating' },
        maxRate: { $max: '$rating' },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    status: '🟢 Success',
    message: 'Rating min, max, and average calculated successfully.',
    stats,
  });
});

exports.calcTimedRatingAverage = asyncWrapper(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(`${req.params.year}-${req.params.month}-01`),
          $lte: new Date(`${req.params.year}-${req.params.month}-31`),
        },
      },
    },
    {
      $group: {
        _id: null,
        allOrders: { $sum: 1 },
        ratingAverage: { $avg: '$rating' },
        minRate: { $min: '$rating' },
        maxRate: { $max: '$rating' },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    status: '🟢 Success',
    message: `Rating min, max, and avaerage of ${req.params.month} calculated successfully.`,
    stats,
  });
});

// TODO implement aggregation pipeline: get top <n> expensive orders
const populateUsers = async (stats) => {
  const usersPromise = stats.map(async (order) => {
    return await User.findById(order.user).select('name phone');
  });
  const users = await Promise.all(usersPromise);

  users.forEach((user, i) => {
    stats[i].user = user.name;
    stats[i].phone = user.phone;
  });

  return stats;
};

exports.getTopNOrders = asyncWrapper(async (req, res, next) => {
  let stats = await Order.aggregate([
    {
      $sort: { cost: -1 },
    },
    {
      $project: {
        user: 1,
        cost: 1,
      },
    },
    {
      $limit: req.params.n * 1,
    },
  ]);

  stats = await populateUsers(stats);

  res.status(200).json({
    status: '🟢 Success',
    message: `List of top ${req.params.n} expensive orders retrieved successfully.`,
    stats,
  });
});

exports.getTimedTopNOrders = asyncWrapper(async (req, res, next) => {
  let stats = await Order.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(`${req.params.year}-${req.params.month}-01`),
          $lte: new Date(`${req.params.year}-${req.params.month}-31`),
        },
      },
    },
    {
      $sort: { cost: -1 },
    },
    {
      $project: {
        user: 1,
        cost: 1,
      },
    },
    {
      $limit: req.params.n * 1,
    },
  ]);

  stats = await populateUsers(stats);

  res.status(200).json({
    status: '🟢 Success',
    message: `List of top ${req.params.n} expensive orders of month ${req.params.month} of year ${req.params.year} retrieved successfully.`,
    stats,
  });
});
