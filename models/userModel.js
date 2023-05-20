const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user document must have a name.'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  birthday: {
    month: {
      type: Number,
      validate: {
        validator: function (val) {
          return val >= 1 && val <= 12;
        },
        message: 'Month should be a value between 1 and 12.',
      },
      required: true,
    },
    day: {
      type: Number,
      validate: {
        validator: function (val) {
          return val >= 1 && val <= 31;
        },
        message: 'Day should be a value between 1 and 31',
      },
      required: true,
    },
  },
  phone: {
    type: String,
    required: [true, 'A user document must have a phone number.'],
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'A password must contain a minimum of 8 characters.'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function (val) {
        return this.password === val;
      },
      message: 'Failed to confirm password.',
    },
    select: false,
  },
  locations: [
    {
      type: pointSchema,
      required: true,
    },
  ],
  activeAddress: {
    type: Number,
    default: 1,
    validate: {
      validator: function (val) {
        return val >= 1 && val <= this.locations.length;
      },
      message: 'Invalid address index.',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    select: false,
    default: true,
  },
});

// COMMENT all doc pre-hooks
// CHECKME why doc considered new when updating user with unrelated key/value?

// check phone number, should start with 0
userSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('phone')) {
    console.log('🟨 Document considered new.');
    if (this.phone.startsWith('0')) return next();
    this.phone = '0' + this.phone;
    console.log('🟩 Zero added.');
    console.log('🟩 final phone number:', this.phone);
  }
  next();
});

// encrypt password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  console.log('🟨 Password considered modified.');
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  console.log('🟩 new password bcrypted. passwordConfirm deleted.');
  next();
});

// set passwordChangedAt
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  console.log(
    '🟨 Password considered modified, and document considered NOT new.'
  );
  this.passwordChangedAt = Date.now();
  console.log('🟩 passwordChangedAt set.');
  next();
});

// COMMENT all query pre-hook
// pre-hook: filter out de-activated users
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// COMMENT all instance methods
// check current password for password update
userSchema.methods.currentPasswordCheck = async function (
  currentPassword,
  userPassword
) {
  return bcrypt.compare(currentPassword, userPassword);
};

// check passwordChangedAt with jwt
userSchema.methods.passwordChangedAfterJWT = function (jwtIat) {
  const passwordChangedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000
  );
  if (passwordChangedTimestamp > jwtIat) {
    return true;
  } else {
    return false;
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
