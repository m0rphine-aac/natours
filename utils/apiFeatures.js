class APIFeatures {
  constructor(query, reqQueryObject) {
    this.query = query;
    this.queryObject = reqQueryObject;
  }

  filter() {
    const { page, sort, limit, fields, ...queryObject } = this.queryObject;

    // Advance filtering
    let queryString = JSON.stringify(queryObject);

    queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryString));

    return this;
  }

  sort() {
    if (this.queryObject.sort) {
      const sortBy = this.queryObject.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt _id');
    }

    return this;
  }

  projection() {
    if (this.queryObject.fields) {
      const fieldsString = this.queryObject.fields.split(',').join(' ');
      this.query = this.query.select(fieldsString);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  pagination() {
    const pageNumber = Math.abs(+this.queryObject.page || 1);
    const limitNumber = Math.abs(+this.queryObject.limit || 10);
    const skip = limitNumber * (pageNumber - 1);

    this.query = this.query.skip(skip).limit(limitNumber);

    return this;
  }
}

module.exports = APIFeatures;
