const express = require('express');

const locationController = require('./../controllers/locationController');

const router = express.Router();

router
  .route('/')
  .get(locationController.getMyLocations)
  .post(locationController.addLocation);

router
  .route('/:id')
  .patch(locationController.editLocation)
  .delete(locationController.deleteLocation);

module.exports = router;
