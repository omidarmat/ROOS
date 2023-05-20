const dotenv = require('dotenv');
const app = require('./app');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

// const dbConStr = process.env.DATABASE_ATLAS.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );

// mongoose
//   .connect(dbConStr, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//   })
//   .then((con) => {
//     console.log('>>> 🟢 Database connected successfully.');
//   });

mongoose
  .connect(process.env.DATABASE_LIARA, {
    authSource: 'admin',
  })
  .then((con) => {
    console.log('>>> 🟢 Database connected successfully.');
  });

app.listen(process.env.PORT, () => {
  console.log('>>> 🟢 Server started at', new Date());
});
