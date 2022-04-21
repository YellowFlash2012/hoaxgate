import app from './server.js';
import sequelize from './src/config/db.js';

import { scheduledCleanup } from './src/routes/TokenService.js';
import logger from './src/shared/logger.js';

sequelize.sync();

scheduledCleanup();

logger.error('error');
logger.warn('warn');
logger.info('info');
logger.verbose('verbose');
logger.debug('debug');
logger.silly('silly');

app.listen(5000, () => {
    logger.info('App is running');
    console.log('Server on | Port 5000');
});
