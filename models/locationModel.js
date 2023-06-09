const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  address: {
    type: String,
    required: true,
  },
  description: String,
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

locationSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name phone',
  });
  next();
});

locationSchema.index({ location: '2dsphere' });

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;
