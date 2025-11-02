const sql = require('mssql');
require('dotenv').config(); // ensures .env variables load locally and in Netlify functions

// Log for debugging (optional — remove once confirmed working)
console.log("DB CONFIG CHECK:", {
  DB_USER: process.env.DB_USER,
  DB_SERVER: process.env.DB_SERVER,
  DB_NAME: process.env.DB_NAME,
});

const config = {
  user: process.env.DB_USER,           // Must match your Netlify env vars
  password: process.env.DB_PASSWORD,   // ^
  server: process.env.DB_SERVER,       // Example: myserver.database.windows.net
  database: process.env.DB_NAME,       // Example: MY_FAVORITE_RECIPES
  options: {
    encrypt: true,                     // Required for Azure SQL
    trustServerCertificate: false      // Should be false in production
  }
};

module.exports = config;
