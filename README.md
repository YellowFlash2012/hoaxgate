# hoaxgate
A TDD Nodejs App

npx http-server -c-1 -p 8080 --cors -P http://localhost:3000
https://www.postgresqltutorial.com/postgresql-administration/psql-commands/

"test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }

npx sequelize-cli init
npx sequelize-cli model:generate --name user --attributes username:string,email:string,password:st6.1]ring
npx sequelize-cli db:migrate