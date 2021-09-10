const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        max: [100, 'Name cannot have more than a 100 characters.']
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: true,
        max: [200, 'email cannot have more than a 100 characters.']

    },
    refresh_token: {
        type: String,
        required: true
    },
    token_expires_in: {
        type: Date,
        required: true
    },
    access_token: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        required: true
    },

    __v: { type: Number, select: false }
});

if (!userSchema.options.toObject) userSchema.options.toObject = {};
userSchema.options.toObject.transform = function (doc, ret, options) {
    delete ret.access_token;
    delete ret.token_expires_in;
    delete ret.refresh_token;
    return ret;
}

const User = mongoose.model('User', userSchema);
module.exports = User;