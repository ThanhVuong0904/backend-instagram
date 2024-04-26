// eslint-disable-next-line global-require
const Server = require('./src/index');

global.httpServer = null;

async function main() {
    global.httpServer = Server.createServer();
}

async function gracefullyShutdown(returnCode = 0, shutdownTimeout = 10000) {
    setTimeout(() => process.exit(returnCode), shutdownTimeout);

    if (
        global.httpServer &&
        typeof global.httpServer === 'object' &&
        typeof global.httpServer.close === 'function'
    ) {
        console.log('Closing http server.');
        await global.httpServer.close();
    }

    process.exit(returnCode);
}


process.once('SIGUSR2', async () => {
    process.stdout.write('SIGUSR2 signal received.\n');
    await gracefullyShutdown(0);
    process.kill(process.pid, 'SIGUSR2');
});
process.once('SIGTERM', async () => {
    process.stdout.write('SIGTERM signal received.\n');
    await gracefullyShutdown(0);
});
process.once('SIGINT', async () => {
    process.stdout.write('SIGINT signal received.\n');
    await gracefullyShutdown(0);
});
process.once('uncaughtException', async (error) => {
    console.error('uncaughtException!', error);
    await gracefullyShutdown(1);
});
process.once('unhandledRejection', async (error) => {
    console.error('unhandledRejection!', error);
    await gracefullyShutdown(1);
});
process.on('warning', async (error) => {
    console.warn('processWarning!', {
        error,
    });
});

main().catch(async (error) => {
    console.error('Server Fatal error occurred!', error);
    await gracefullyShutdown(1);
});
