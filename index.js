import app from './server.js';
import sequelize from './src/config/db.js';

import { scheduledCleanup } from './src/routes/TokenService.js';
import logger from './src/shared/logger.js';

sequelize.sync();

scheduledCleanup();

app.listen(process.env.PORT || 5000, () => {
    logger.info('App is running. Version: ' + process.env.npm_package_version);
    console.log('Server on | Port 5000');
});
