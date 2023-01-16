// NPM MODULES
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// CUSTOM MODULES
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

module.exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  // 3) Send it to client
  res.status(200).json({
    status: 'success',
    session,
  });
});

module.exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // {createBookingCheckout} is a temporary solution to create booking in our DB (Not secure)

  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

module.exports.createBooking = factory.createOne(Booking);

module.exports.getBooking = factory.getOne(Booking);

module.exports.getAllBookings = factory.getAll(Booking);

module.exports.updateBooking = factory.updateOne(Booking);

module.exports.deleteBooking = factory.deleteOne(Booking);
