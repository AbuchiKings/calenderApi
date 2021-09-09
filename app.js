const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const sanitizeNosqlQuery = require('express-mongo-sanitize');
const preventCrossSiteScripting = require('xss-clean')
const preventParameterPollution = require('hpp');
const compression = require('compression');
const cors = require('cors');
const router = require('./routes/router');
//const globalErrorHandler = require('./utils/globalErrorHandler')

const app = express();

mongoose.connect(process.env.MONGODB_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    poolSize: 15
}).then(con => console.log(`Connected to ${con.connections[0].name} Database successfully`))
    .catch(error => { return console.log(error); });


app.use(express.static(path.join(__dirname, 'public')));


app.use(cors());
app.options('*', cors()); //Later put a whitelist on cors options for app routes only
app.set('trust proxy', true);

app.use(helmet());
app.use('/', rateLimiter({
    max: 200,
    windowMs: 1000 * 60 * 60,
    message: 'Too many requests from this IP. Try again in an hour.'
}));

app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.use(sanitizeNosqlQuery());
app.use(preventCrossSiteScripting());
app.use(preventParameterPollution());

app.use(compression());

app.use(router);
//Would be replaced later with a detailed error handling function
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        err.statusCode = err.statusCode || 500;
        err.message = err.statusCode === 500 ? "An error was encountered while carrying out the operation." : err.message;
    }
    res.status(err.statusCode || 500);
    return res.json({ status: 'error', message: err.message });
});

module.exports = { app };