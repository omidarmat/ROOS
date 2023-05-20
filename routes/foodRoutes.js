const express = require('express');
const foodController = require('./../controllers/foodController');
const authController = require('./../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(foodController.getAllFoods)
  .post(
    authController.protect,
    authController.authorize('admin'),
    foodController.createFood
  );

router
  .route('/:id')
  .patch(
    authController.protect,
    authController.authorize('admin'),
    foodController.updateFood
  )
  .delete(
    authController.protect,
    authController.authorize('admin'),
    foodController.deleteFood
  );

module.exports = router;
