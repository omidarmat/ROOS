const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);

router.use(authController.protect);

router.route('/logout').get(authController.logout);

router.route('/updateMyPassword').patch(userController.updateMyPassword);

router
  .route('/myLocations')
  .get(userController.getMyLocations)
  .post(userController.addLocation);

router
  .route('/myLocations/:id')
  .patch(userController.updateLocation)
  .delete(userController.deleteLocation);

router
  .route('/')
  .get(authController.authorize('admin'), userController.getAllUsers)
  .post(authController.authorize('admin'), userController.createUser);

router
  .route('/me')
  .get(userController.getMe, userController.getUser)
  .delete(userController.deleteMe)
  .patch(userController.updateMe);

router
  .route('/:id')
  .get(authController.authorize('admin'), userController.getUser)
  .delete(authController.authorize('admin'), userController.deleteUser)
  .patch(authController.authorize('admin'), userController.updateUser);

module.exports = router;
