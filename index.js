import app from './server.js'
import sequelize from './src/config/db.js';

sequelize.sync();

app.listen(8080, () => {
    console.log('Server on | Port 8080');
});