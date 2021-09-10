const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const errorHandler = require('./../utils/errorHandler');
const responseHandler = require('../utils/responseHandler');
const { promisify } = require('util')
dotenv.config()


const SECRET = process.env.JWT_KEY;

const auth = {

    async verifyToken(req, res, next) {
        try {
            const access = req.headers.authorization;

            let token;
            if (access && access.startsWith('Bearer')) {
                let bearerToken = access.split(' ');
                token = bearerToken[1];

            } else if ((req.cookies && req.cookies.jwt)) {
                token = req.cookies.jwt;
            } else {
                return errorHandler(401, 'Invalid credentials. Please login with your details')
            }

            if (!token) return errorHandler(401, 'Unauthorised. Please login with your details');

            const decodedToken = await promisify(jwt.verify)(token, SECRET);

            const User = require('../models/user/user');
            const WebToken = require('../models/tokens/webSession');
            const fields = ['+refresh_token', '+access_token', '+token_expires_in'];
            const currentUser = await User.findOne({ _id: decodedToken._id }).select(fields).lean();
            let session_token = currentUser ? await WebToken.findOne({ user_id: currentUser._id, session_token: decodedToken.token }).lean() : false;

            if (!currentUser) return errorHandler(401, `Unauthorised. Please login with your details.`);
            if (!session_token) return errorHandler(401, `Unauthorised. Please login with your details.`);
            req.user = currentUser;
            req.decodedToken = decodedToken;
            return next();
        } catch (error) {
            if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
                error.message = 'Unauthorised. Please login with your details';
                error.statusCode = 401;
            };
            next(error);
        }
    },

    signToken: async (req, res, next) => {
        try {
            const { session_token } = req;
            const { _id, email} = req.user;
            const token = jwt.sign({ _id, email, token: session_token}, SECRET, { expiresIn: process.env.JWT_EXPIRATION_TIMEFRAME });
            req.token = token;
            next();
        } catch (error) {
            next(error);
        }
    },

    addToken(req, res, next) {
        const token = req.token;
        const cookieOptions = {
            httpOnly: true,
            expires: new Date(Date.now() + process.env.JWT_EXPIRY_TIME * 1000 * 60 * 60 * 24),
            sameSite: 'None'
        }
        cookieOptions.secure = req.secure || req.protocol === 'https';

        if (process.env.NODE_ENV === 'production' && !cookieOptions.secure) {
            return errorHandler(401, 'You cannot be logged in when your network connection is not secure!');
        }
        const message = req.message || 'Successfully logged in'
        res.cookie('jwt', token, cookieOptions);
        let data = { token, ...req.user };
        return responseHandler(res, data, next, 200, message, 1);
    },

    logout: async (req, res, next) => {
        try {
            const WebToken = require('../models/tokens/webSession');
            await WebToken.findOneAndDelete({ user_id: req.user._id, session_token: req.decodedToken.token }).lean();
            res.clearCookie('jwt');
            return res.status(200).json({
                status: 'success',
                message: 'Successfully logged out',
                token: null
            });
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = auth;
