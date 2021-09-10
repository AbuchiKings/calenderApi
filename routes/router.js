const { Router } = require('express');
const router = Router();

const auth = require('../middleware/auth')

const User = require('../controller/user/userController')


router.post('/api/v1/login', User.login, auth.signToken, auth.addToken);

router.get('/api/v1/events', auth.verifyToken, User.getCalenderEvents);

router.get('/', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Welcome to calender. Events made easy."
    });
});

router.all('*', (req, res) => {
    return res.status(404).json({
        status: "error",
        message: `Cannot find ${req.originalUrl} on this server.`
    });
});

module.exports = router;