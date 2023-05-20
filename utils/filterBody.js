const filterBody = (body, ...allowedKeys) => {
  const newObj = {};
  Object.keys(body).forEach((key) => {
    if (allowedKeys.includes(key)) {
      newObj[key] = body[key];
    }
  });

  return newObj;
};

module.exports = filterBody;
