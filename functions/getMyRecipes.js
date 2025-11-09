// netlify/functions/getMyRecipes.js
const sql = require('mssql');
const jwt = require('jsonwebtoken');

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    // Get userId from query parameters
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'userId is required'
        })
      };
    }

    console.log(`Connecting to database for userId: ${userId}...`);
    pool = await sql.connect(config);

    console.log('Fetching user recipes...');
    const result = await pool.request()
      .input('userId', sql.Int, parseInt(userId))
      .query(`
        SELECT 
          r.RECIPE_ID as id,
          r.TITLE as title,
          r.IMAGE_URL as image,
          r.INGREDIENTS as ingredients,
          r.STEPS as steps,
          r.CREATED_AT as createdAt
        FROM RECIPES r
        WHERE r.USER_ID = @userId
        ORDER BY r.CREATED_AT DESC
      `);

    console.log(`Found ${result.recordset.length} recipes for user ${userId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Recipes fetched successfully',
        recipes: result.recordset
      })
    };

  } catch (error) {
    console.error('Error fetching user recipes:', error);
    
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