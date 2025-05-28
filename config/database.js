const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'daysaveappb',      // DB name
  process.env.DB_USER || 'root',               // DB user
  process.env.DB_PASSWORD || 'mysql5984getto', // DB password
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3303,         // port goes here, as an option!
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
