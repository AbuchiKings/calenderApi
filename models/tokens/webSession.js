const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    session_token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        expires: '86400m',
    }
});

const WebToken = mongoose.model('WebToken', tokenSchema);
module.exports = WebToken;