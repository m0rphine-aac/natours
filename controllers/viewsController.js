// CUSTOM MODULES
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

module.exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get tour data from collection
  const tours = await Tour.find({});

  // 2) Build template (Inside '/views')

  // 3) Render that template using the tour data from step 1
  res.status(200).render('overview', { tours });
});

module.exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data, for the requested tour (including reviews and tour guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user -__v -_id',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // 2) Build the template (Inside '/views')

  // 3) Render template using the data from step 1

  res.status(200).render('tour', { title: `${tour.name} Tour`, tour });
});

module.exports.getLoginForm = (req, res) => {
  res.status(200).render('login', { title: 'Log into your account' });
};

module.exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', { title: 'Signup' });
};

module.exports.getAccount = (req, res) => {
  res.status(200).render('account', { title: 'Your account' });
};

module.exports.getMyTours = catchAsync(async (req, res) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map(booking => booking.tour);

  const tours = await Promise.all(
    tourIDs.map(async id => {
      const [tour] = await Tour.find({ _id: id });
      return tour;
    })
  );

  // 3) Render page
  res.status(200).render('overview', { title: 'My tours', tours });
});
