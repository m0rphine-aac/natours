// CUSTOM MODULES
const Tour = require('../models/tourModel');
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

module.exports.getLoginFrom = (req, res) => {
  res.status(200).render('login', { title: 'Log into your account' });
};

module.exports.getAccount = (req, res) => {
  res.status(200).render('account', { title: 'Your account' });
};
