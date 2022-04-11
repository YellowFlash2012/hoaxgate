import app from './server.js'
import sequelize from './src/config/db.js';

sequelize.sync({ alter: true });

app.listen(5000, () => {
    console.log('Server on | Port 5000');
});