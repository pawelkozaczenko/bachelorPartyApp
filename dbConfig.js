require("dotenv").config();

const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const connectionStringProd = `postgresql://${process.env.DB_USER_P}:${process.env.DB_PASSWORD_P}@${process.env.DB_HOST_P}:${process.env.DB_PORT_P}/${process.env.DB_DATABASE_P}`;

const pool = new Pool({
  connectionString: isProduction ? connectionStringProd : connectionString,
  //ssl: isProduction
});

module.exports = { pool };