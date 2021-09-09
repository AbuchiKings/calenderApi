const { Router } = require('express');
const router = Router();

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