const Location = require('./../models/locationModel');
const asyncWrapper = require('./../utils/asyncWrapper');
const filterBody = require('./../utils/filterBody');
const appError = require('./../utils/appError');

exports.getMyLocations = asyncWrapper(async (req, res, next) => {
  res.status(200).json({
    status: '🟢 Success',
    locations: req.user.locations,
  });
});

exports.addLocation = asyncWrapper(async (req, res, next) => {
  const filteredBody = filterBody(
    req.body,
    'location',
    'address',
    'description'
  );

  filteredBody.user = req.user._id;

  const newLocation = await Location.create(filteredBody);

  req.user.locations.push(newLocation._id);
  req.user.activeAddress = req.user.locations.length;

  await req.user.save();

  res.status(200).json({
    status: '🟢 Success',
    message:
      'Location added successfully. We will consider this address as your current location. You can change this from your account settings.',
    newLocation,
  });
});

exports.editLocation = asyncWrapper(async (req, res, next) => {
  const locationCheck = req.user.locations.find((id) =>
    id.equals(req.params.id)
  );
  if (!locationCheck) {
    return next(
      new appError('This location ID is not yours. You cannot edit it.', 403)
    );
  }
  const targetLocation = await Location.findById(req.params.id);

  const filteredBody = filterBody(
    req.body,
    'locations',
    'address',
    'description'
  );

  Object.keys(filteredBody).forEach((field) => {
    targetLocation[field] = filteredBody[field];
  });

  await targetLocation.save();

  res.status(200).json({
    status: '🟢 Success',
    message: 'Location edited successfully.',
    targetLocation,
  });
});

exports.deleteLocation = asyncWrapper(async (req, res, next) => {
  const locationCheck = req.user.locations.find((id) =>
    id.equals(req.params.id)
  );
  if (!locationCheck) {
    return next(
      new appError('This location ID is not yours. You cannot edit it.', 403)
    );
  }

  await Location.findByIdAndDelete(req.params.id);

  const newLocationsArray = [];
  req.user.locations.forEach((id) => {
    if (!id.equals(req.params.id)) newLocationsArray.push(id);
  });

  req.user.locations = newLocationsArray;
  req.user.activeAddress = newLocationsArray.length;
  await req.user.save();

  res.status(204).json({
    status: '🟢 Success',
    message: 'Location removed successfully.',
  });
});

exports.getUsersWithin = asyncWrapper(async (req, res, next) => {
  const { distance } = req.params;
  const radius = distance / 6378.1;
  const locations = await Location.find({
    location: {
      $geoWithin: {
        $centerSphere: [[process.env.BASE_LNG, process.env.BASE_LAT], radius],
      },
    },
  });

  res.status(200).json({
    status: '🟢 Success.',
    message: `All users within the ${distance}km radius of BASE are retrieved successfully.`,
    results: locations.length,
    locations,
  });
});
