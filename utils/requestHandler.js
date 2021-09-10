const axios = require('axios');

const requestHandler = async ({ verb, payload, url, headers }) => {
    const method = verb || 'get';
    return axios({
        data: payload,
        url: url,
        method,
        headers,
    });
};

module.exports = requestHandler;