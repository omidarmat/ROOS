const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
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
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;
