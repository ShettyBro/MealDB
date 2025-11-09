// netlify/functions/getRecipeById.js
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
    // Get recipeId from query parameters
    const recipeId = event.queryStringParameters?.id;

    if (!recipeId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Recipe ID is required'
        })
      };
    }

    console.log(`Connecting to database for recipeId: ${recipeId}...`);
    pool = await sql.connect(config);

    console.log('Fetching recipe details...');
    const result = await pool.request()
      .input('recipeId', sql.Int, parseInt(recipeId))
      .query(`
        SELECT 
          r.RECIPE_ID as id,
          r.TITLE as title,
          r.IMAGE_URL as image,
          r.INGREDIENTS as ingredients,
          r.STEPS as steps,
          r.CREATED_AT as createdAt,
          r.USER_ID as userId,
          u.FULLNAME as createdBy
        FROM RECIPES r
        LEFT JOIN USERS u ON r.USER_ID = u.USER_ID
        WHERE r.RECIPE_ID = @recipeId
      `);

    if (result.recordset.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          message: 'Recipe not found'
        })
      };
    }

    console.log(`Recipe found: ${result.recordset[0].title}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Recipe fetched successfully',
        recipe: result.recordset[0]
      })
    };

  } catch (error) {
    console.error('Error fetching recipe:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Failed to fetch recipe',
        error: error.message
      })
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};