require('dotenv').config();
const http = require('http');
const { app } = require('./app');


process.on('uncaughtException', (error) => {
    console.log(error);
    process.exit(1);
});

const server = http.createServer(app);

server.listen(process.env.PORT || 8083, () => {
    console.log('Server is running on port 8082');
});

process.on('unhandledRejection', (error) => {
    console.log(error.name, error.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Process terminated!');
    });
});
process.on('SIGINT', () => {
    server.close(() => {
        console.log('Process terminated!');
        process.exit(1);
    });
});