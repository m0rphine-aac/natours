// CORE MODULES
const fs = require('fs');

// NPM MODULES
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// CUSTOM MODULES
const Tour = require('./../../models/tourModel');

dotenv.config({ path: './config.env' });

// Import tour documents to the Tours collection
const importTourData = async () => {
  try {
    await Tour.create(tours);
    console.log('Tour data successfully imported...');
  } catch (err) {
    console.log(err.message);
  }
};

// Delete all documents from Tours collection
const deleteTourData = async () => {
  try {
    await Tour.deleteMany({});
    console.log('Tour data successfully deleted from Tours collection');
  } catch (err) {
    console.log(err.message);
  }
};

// Read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

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
      await importTourData();
      mongoose.connection
        .close()
        .then(() => {
          console.log('Disconnected from the database');
          process.exit();
        })
        .catch(err => {
          console.log(err.message);
        });
    }

    if (process.argv[2] === '--delete') {
      await deleteTourData();
      mongoose.connection
        .close()
        .then(() => {
          console.log('Disconnected from the database');
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
