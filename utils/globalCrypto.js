const crypto = require('crypto');

exports.cipherize = (data) => {
  const cipher = crypto.createCipheriv(
    process.env.ENCRYPT_ALGO,
    process.env.ENCRYPT_KEY,
    process.env.ENCRYPT_INIT_VEC
  );
  let encryptedData = cipher.update(data, 'utf-8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
};

exports.decipherize = (encryptedData) => {
  const decipher = crypto.createDecipheriv(
    process.env.ENCRYPT_ALGO,
    process.env.ENCRYPT_KEY,
    process.env.ENCRYPT_INIT_VEC
  );
  let data = decipher.update(encryptedData, 'hex', 'utf-8');
  data += decipher.final('utf8');
  return data;
};
