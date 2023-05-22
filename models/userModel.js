const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const globalCrypto = require('./../utils/globalCrypto');
const crypto = require('crypto');
const appError = require('../utils/appError');

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
      type: mongoose.Schema.ObjectId,
      ref: 'Location',
    },
  ],
  activeAddress: {
    type: Number,
    default: undefined,
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
// userSchema.pre('save', function (next) {
//   if (this.isNew || this.isModified('phone')) {
//     console.log('🟨 Document considered new.');
//     if (this.phone.startsWith('0')) return next();
//     this.phone = '0' + this.phone;
//     console.log('🟩 Zero added.');
//     console.log('🟩 final phone number:', this.phone);
//   }
//   next();
// });

// encrypt password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  console.log('🟨 Password considered modified.');
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  console.log('🟩 new password bcrypted. passwordConfirm deleted.');
  next();
});

// encrypt incoming user data
userSchema.pre('save', function (next) {
  this.encryptUserData('name', 'phone');
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
// filter out de-activated users
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// decrypt outgoing user data
userSchema.post(/^find/, function (docs, next) {
  if (!docs) return next(new appError('User not found.', 400));
  if (Array.isArray(docs)) {
    docs.forEach((user) => user.decryptUserData('phone', 'name'));
  } else {
    docs.decryptUserData('phone', 'name');
  }
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

// create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.encryptUserData = function (...fields) {
  const encryptFields = fields;
  encryptFields.forEach((field) => {
    this[field] = globalCrypto.cipherize(this[field]);
  });
};

userSchema.methods.decryptUserData = function (...fields) {
  const decryptFields = fields;
  decryptFields.forEach((field) => {
    this[field] = globalCrypto.decipherize(this[field]);
  });
};

const User = mongoose.model('User', userSchema);
module.exports = User;
