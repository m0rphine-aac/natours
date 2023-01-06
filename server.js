// NPM MODULES
const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
  console.log('Inside server.js', err.name, err.message);
  console.log('Shutting down...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

// CUSTOM MODULES
const app = require('./app');

// CONNECT TO DB
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(connection => {
    console.log('Connected to database...');
  });

// START SERVER
const port = process.env.PORT;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('Inside server.js', err.name, err.message);
  server.close(() => {
    console.log('Shutting down...');
    process.exit(1);
  });
});
