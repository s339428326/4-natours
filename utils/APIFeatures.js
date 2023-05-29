class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //Create Query
    const filterQuery = { ...this.queryString };

    //filter excluded word for Query
    const excludedField = ['page', 'sort', 'limit', 'fields'];
    excludedField.forEach((field) => delete filterQuery[field]);

    //1. feature Query can using mongoDB $gte.. word
    let queryString = JSON.stringify(filterQuery);
    queryString = queryString.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (match) => `$${match}`
    );

    this.query.find(JSON.parse(queryString)).sort('-createdAt');

    return this;
  }

  toSpaceString(str) {
    //string arr split , insert ' ' space for mongoose select using.
    return str.split(',').join(' ');
  }

  //2. feature using query to sorting tours data else sorting by createTime
  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.toSpaceString(this.queryString.sort));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  //3. feature using Field limiting
  limitField() {
    if (this.queryString.fields) {
      this.query = this.query.select(
        this.toSpaceString(this.queryString.fields)
      );
    } else {
      //hidden mongoose default version field
      this.query = this.query.select('-__v');
    }

    return this;
  }

  //4. pagination
  pagination() {
    const limit = parseInt(this.queryString.limit, 10) || 100;
    const page = parseInt(this.queryString.page, 10) || 1;
    const skip = (page - 1) * limit;

    this.query = this.query.sort('_id').skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
