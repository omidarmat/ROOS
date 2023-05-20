const queryManager = (Model, query) => {
  const queryObj = { ...query };

  const excludedFields = ['page', 'sort', 'fields', 'limit'];
  excludedFields.forEach((field) => delete queryObj[field]);

  let queryObjStr = JSON.stringify(queryObj);
  queryObjStr = queryObjStr.replace(
    /\b(gt|gte|lt|lte)\b/g,
    (bingo) => `$${bingo}`
  );

  let builtQuery = Model.find(JSON.parse(queryObjStr));

  if (query.sort) {
    builtQuery = builtQuery.sort(query.sort.split(',').join(' '));
  }

  if (query.fields) {
    builtQuery = builtQuery.select(query.fields.split(',').join(' '));
  }

  const page = query.page * 1 || 1;
  const limit = query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  builtQuery = builtQuery.skip(skip).limit(limit);
  return builtQuery;
};

module.exports = queryManager;
