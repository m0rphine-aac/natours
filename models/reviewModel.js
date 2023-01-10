// NPM MODULES
const mongoose = require('mongoose');

// CUSTOM MODULES
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: [1, 'Ratings must be above or equal to 1'],
      max: [5, 'Ratings must be below or equal to 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user!'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes (1: asc order, -1: desc order)
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
  }

  next();
});

// STATIC METHODS
reviewSchema.statics.calcAverageRatings = async function (tourID) {
  // In static methods the 'this' keyword points to the current Model (i.e. Review in this case)
  const stats = await this.aggregate([
    {
      $match: { tour: tourID },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length) {
    await Tour.findByIdAndUpdate(tourID, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourID, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

// DOCUMENT MIDDLEWARE(s): runs before .save() and .create()
reviewSchema.post('save', function (doc, next) {
  // 'this' points to currently saved document (i.e. review doc in this case)
  this.constructor.calcAverageRatings(this.tour);

  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
