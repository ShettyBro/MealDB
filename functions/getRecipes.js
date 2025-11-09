// netlify/functions/getRecipes.js
const sql = require('mssql');

// Database configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  let pool;

  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);

    console.log('Fetching all recipes...');
    const result = await pool.request().query(`
      SELECT 
        r.RECIPE_ID as id,
        r.TITLE as title,
        r.IMAGE_URL as image,
        r.INGREDIENTS as ingredients,
        r.STEPS as steps,
        r.CREATED_AT as createdAt,
        u.FULLNAME as createdBy
      FROM RECIPES r
      LEFT JOIN USERS u ON r.USER_ID = u.USER_ID
      ORDER BY r.CREATED_AT DESC
    `);

    console.log(`Found ${result.recordset.length} recipes`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Recipes fetched successfully',
        recipes: result.recordset
      })
    };

  } catch (error) {
    console.error('Error fetching recipes:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Failed to fetch recipes',
        error: error.message
      })
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};