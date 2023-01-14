// NPM MODULES
const express = require('express');

// CUSTOM MODULES
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

// FRONT END ROUTES
router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginFrom);
router.get('/me', authController.protect, viewsController.getAccount);

module.exports = router;
