// CORE MODULES
const crypto = require('crypto');

// NPM MODULES
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email id!'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (value) {
        return validator.isEmail(value);
      },
      message: 'Invaild email ID',
    },
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password!'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    minLength: 8,
    validate: {
      // This validator only runs on CREATE and SAVE!!!
      validator: function (value) {
        return value === this.password;
      },
      message: 'Passwords are not same!',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// DOCUMENT MIDDLEWARE(s): runs before .save() and .create()
userSchema.pre('save', async function (next) {
  // Only run this function if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the passwordConfirm field
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now();

  next();
});

// QUERY MIDDLEWARE
userSchema.pre(/^find/, function (next) {
  // 'this' points to current query
  this.find({ active: { $ne: false } });

  next();
});

// INSTANCE METHODS (Available on all documents of a certain collection)
userSchema.methods.checkPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedAtTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimestamp < changedAtTimestamp;
  }

  // False means the user doesn't changed the password after the token was issued!
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // Generate temporary password
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Save and encrypt the temporary password
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expiration time to 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // return temporary password (without encryption)
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
