const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A food document must have a name.'],
    unique: true,
  },
  category: {
    type: String,
    required: [true, 'A food document must be assigned to a category.'],
    enum: ['pizza', 'sandwich', 'appetizer', 'drinks'],
  },
  ingredients: {
    type: [String],
    required: [true, 'A food document must include its ingredients.'],
  },
  price: {
    type: Number,
    required: [true, 'A food must have a price.'],
  },
  isFinished: {
    type: Boolean,
    default: false,
  },
});

foodSchema.pre(/^find/, function (next) {
  this.find({ isFinished: { $ne: true } });
  next();
});

const Food = mongoose.model('Food', foodSchema);
module.exports = Food;
