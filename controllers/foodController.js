const asyncWrapper = require('./../utils/asyncWrapper');
const Food = require('./../models/foodModel');
const queryManager = require('./../utils/queryManager');
const appError = require('../utils/appError');

exports.getAllFoods = asyncWrapper(async (req, res) => {
  const foods = await queryManager(Food, req.query);

  res.status(200).json({
    status: '🟢 Success',
    message: 'All documents retrieved.',
    numResults: foods.length,
    data: {
      foods,
    },
  });
});

exports.createFood = asyncWrapper(async (req, res) => {
  const newFood = {
    name: req.body.name,
    category: req.body.category,
    ingredients: req.body.ingredients,
    price: req.body.price,
    isMain: req.body.isMain,
  };

  const persistedDoc = await Food.create(newFood);

  res.status(200).json({
    status: '🟢 Success',
    message: 'Food document created successfully.',
    data: {
      persistedDoc,
    },
  });
});

exports.updateFood = asyncWrapper(async (req, res) => {
  const targetFood = await Food.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!targetFood) next(new appError('No documents found with that ID.', 404));

  res.status(200).json({
    status: '🟢 Success',
    message: 'Target food document successfully updated.',
    data: {
      targetFood,
    },
  });
});

exports.deleteFood = asyncWrapper(async (req, res) => {
  const targetFood = await Food.findByIdAndDelete(req.params.id);

  if (!targetFood) next(new appError('No documents found with that ID.', 404));

  res.status(200).json({
    status: '🟢 Success',
    data: null,
  });
});
