const express = require('express');

const globalErrorHandler = require('./controllers/errorController');
const appError = require('./utils/appError');

const foodRouter = require('./routes/foodRoutes');
const userRouter = require('./routes/userRoutes');
const orderRouter = require('./routes/orderRoutes');

const app = express();

app.use(express.json());

app.use('/foods', foodRouter);
app.use('/users', userRouter);
app.use('/orders', orderRouter);

app.all('*', (req, res, next) => {
  next(new appError('This route does not exist on this server.', 404));
});

app.use(globalErrorHandler);

module.exports = app;
