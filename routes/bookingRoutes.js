// NPM MODULES
const express = require('express');

// CUSTOM MODULES
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Protect all the following routes
router.use(authController.protect);

// Create and send stripe checkout session to loggedin user
router.get(
  '/checkout-session/:tourID',
  authController.protect,
  bookingController.getCheckoutSession
);

// Restrict all the following routes to only 'admin' and 'lead-guide' users
router.use(authController.restrictTo('admin', 'lead-guide'));

router.route('/').get(bookingController.getAllBookings).post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
