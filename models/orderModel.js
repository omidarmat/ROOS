const mongoose = require('mongoose');

const Food = require('./foodModel');
const User = require('./userModel');
const Location = require('./locationModel');

const orderSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'An order document must have a date.'],
    default: new Date(),
  },
  items: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Food',
    },
  ],
  amounts: [
    {
      type: Number,
      required: true,
      min: [1, 'Amount minimum is 1.'],
      max: [10, 'Amount maximum is 10.'],
    },
  ],
  cost: Number,
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  location: {
    coordinates: [Number],
    address: String,
  },
  review: {
    type: String,
    default: 'Did you like this order?',
    minLength: [4, 'A review cannot have less then 4 characters.'],
  },
  reviewedAt: {
    type: Date,
  },
  rating: {
    type: Number,
    default: 4,
    min: [1, 'Rate minimum is 1.'],
    max: [5, 'Rate maximum is 5.'],
  },
});

// COMMENT all document pre-hooks
// embed item names and price, calc cost
orderSchema.pre('save', async function (next) {
  const foodPromises = this.items.map(
    async (id) => await Food.findById(id).select('name price')
  );
  this.items = await Promise.all(foodPromises);
  this.calcCost();

  next();
});

// embed address + user id and name and phone
orderSchema.pre('save', async function (next) {
  const user = await User.findById(this.user);

  const locationId = user.locations[user.activeAddress - 1];
  const location = await Location.findById(locationId).select(
    'location address'
  );
  this.location.coordinates = location.location.coordinates;
  this.location.address = location.address;
  next();
});

// COMMENT all query pre-hooks
// populate user with name and phone
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name phone',
  });
  next();
});

// COMMENT instance methods
// calculate order cost
orderSchema.methods.calcCost = function () {
  const cost = this.items.reduce((acc, item, i) => {
    return acc + item.price * this.amounts[i];
  }, 0);
  this.cost = cost;
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
