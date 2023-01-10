// CORE MODULES
const fs = require('fs');

// NPM MODULES
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// CUSTOM MODULES
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

dotenv.config({ path: './config.env' });

// Import documents to the DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await Review.create(reviews);
    await User.create(users, { validateBeforeSave: false });
    console.log('Data successfully imported...');
  } catch (err) {
    console.log(err.message);
  }
};

// Delete all documents from DB
const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});
    console.log('Data successfully deleted from collections...');
  } catch (err) {
    console.log(err.message);
  }
};

// Read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// Connect database
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

(async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    console.log('Connected to database...');

    if (process.argv[2] === '--import') {
      await importData();
      mongoose.connection
        .close()
        .then(() => {
          console.log('Disconnected from the database...');
          process.exit();
        })
        .catch(err => {
          console.log(err.message);
        });
    }

    if (process.argv[2] === '--delete') {
      await deleteData();
      mongoose.connection
        .close()
        .then(() => {
          console.log('Disconnected from the database...');
          process.exit();
        })
        .catch(err => {
          console.log(err.message);
        });
    }
  } catch (err) {
    console.log(err.message);
  }
})();
