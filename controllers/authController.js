// CORE MODULES
const crypto = require('crypto');
const { promisify } = require('util');

// NPM MODULES
const jwt = require('jsonwebtoken');

// CUSTOM MODULES
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const generateJWTToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (user, statusCode, res) => {
  const token = generateJWTToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions['secure'] = true;
  }

  res.cookie('JWT', token, cookieOptions);

  // Remove password and active property from output
  user.password = undefined;
  user.active = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

module.exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    photo: req.body.photo,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  return sendToken(newUser, 201, res);
});

module.exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Email or Password is incorrect!', 401));
  }

  if (!(await user.checkPassword(password, user.password))) {
    return next(new AppError('Email or Password is incorrect!', 401));
  }

  // 3) If everything is ok, send the JWT token
  return sendToken(user, 201, res);
});

module.exports.logout = (req, res) => {
  res.cookie('JWT', 'loggedout', { expires: new Date(Date.now() + 1000), httpOnly: true });
  res.status(200).json({ status: 'success' });
};

module.exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Check if the token exists
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.JWT) {
    token = req.cookies.JWT;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please login to get access!', 401));
  }

  // 2) Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please login again.', 401));
  }

  // 5) Grant access to the protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

module.exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'lead-guide'] and is available via function closure
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action!', 403));
    }

    next();
  };
};

module.exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address!', 404));
  }

  // 2) Generate a random reset token/password
  const resetToken = user.createPasswordResetToken();

  // 3) Save the document to the DB
  await user.save({ validateModifiedOnly: true });

  try {
    // 4) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateModifiedOnly: true });

    return next(new AppError('There was an error sending the email. Try again later :('), 500);
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to your email!',
  });
});

module.exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token from DB
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Update changedPasswordAt property for that user (implemented in User model)
  // 4) Log the user in, send JWT
  const token = generateJWTToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

module.exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from DB
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted current password is correct
  if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong!', 401));
  }

  // 3) If so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // 4) Log the user in, send JWT
  return sendToken(user, 200, res);
});

// Only for rendered pages, no errors!
module.exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.JWT) {
    try {
      // 1) Verify the token
      const decoded = await promisify(jwt.verify)(req.cookies.JWT, process.env.JWT_SECRET);

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // 4) The user is loggedIn
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};
