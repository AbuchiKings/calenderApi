const { body, validationResult } = require('express-validator');
const errorHandler = require('../utils/errorHandler');

const validateCode = [
    body('code')
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage('A valid code must be provided')
        .custom((value) => {
            if (!value) {
                return false;
            }
            let val = value.trim();

            return val.length > 1;
        }).withMessage('Invalid Code!')
];


const validationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorHandler(422, errors.array()[0].msg);
    } else {
        next();
    }
};

const validator = {
    validateCode,
    validationHandler
}

module.exports = validator;