const sql = require('mssql');

// Configuration object for the database
const config = {
    user: process.env.DB_USER, // Ensure this is set in Netlify
    password: process.env.DB_PASSWORD, // Ensure this is set in Netlify
    server: process.env.DB_SERVER, // Ensure this is set in Netlify
    database: process.env.DB_NAME, // Ensure this is set in Netlify
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Change to false if using production
    }
};

// Export the sql module and the config object
module.exports =  config;
