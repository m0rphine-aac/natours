// CUSTOM MODULES
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

// Generalization of controller functions to remove duplicate code
////////////////////////////////////////

module.exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('No document find with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

module.exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const updatedDocument = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedDocument) {
      return next(new AppError('Document not found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: updatedDocument,
      },
    });
  });

module.exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const newDocument = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: newDocument,
      },
    });
  });

module.exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (Object.keys(populateOptions).length) {
      query = query.populate(populateOptions);
    }

    const document = await query;

    if (!document) {
      return next(new AppError('Document not found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

module.exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // This is for nested review routes on tour (kind of a work-around solution)
    let filter = {};
    if (req.params.tourID) {
      filter = { tour: req.params.tourID };
    }

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .projection()
      .pagination();

    // Execute query
    // const documents = await features.query.explain();
    const documents = await features.query;

    if (!documents.length) {
      next(new AppError('No document found', 404));
    }

    // Send response
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        data: documents,
      },
    });
  });
