const mongoose = require('mongoose');

const Food = require('./foodModel');
const User = require('./userModel');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  description: String,
});

const orderSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'An order document must have a date.'],
    default: new Date(),
  },
  items: Array,
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
    type: pointSchema,
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

// embed address
orderSchema.pre('save', async function (next) {
  const user = await User.findById(this.user);
  this.location = user.locations[user.activeAddress - 1];
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

// COMMENT all aggregate post-hooks
// orderSchema.post('aggregate', function (docs, next) {
//   if (docs[0].user) {
//     docs.forEach(async (doc) => {
//       const usersPromise = await User.findById(doc.user).select('name');
//       const users = await Promise.all(usersPromise);
//       doc.user = user.name;
//     });
//   }
//   next();
// });

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
