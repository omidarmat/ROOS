const express = require('express');

const orderController = require('./../controllers/orderController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/ratingAverage')
  .get(authController.authorize('admin'), orderController.calcRatingAverage);

router
  .route('/ratingAverage/:month/:year?')
  .get(
    authController.authorize('admin'),
    orderController.calcTimedRatingAverage
  );

router.route('/topOrders/:n').get(orderController.getTopNOrders);

router
  .route('/topOrders/:n/:month/:year')
  .get(orderController.getTimedTopNOrders);

router
  .route('/')
  .get(authController.authorize('admin'), orderController.getAllOrders)
  .post(authController.authorize('user'), orderController.createOrder);

router
  .route('/:id')
  .patch(authController.authorize('user'), orderController.reviewOrder);

module.exports = router;
