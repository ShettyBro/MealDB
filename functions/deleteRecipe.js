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
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
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
          message: 'Recipe ID is required',
          success: false
        })
      };
    }

    console.log(`Attempting to delete recipe ID: ${recipeId}`);

    // Connect to database
    pool = await sql.connect(config);

    // Check if recipe exists first
    const checkResult = await pool.request()
      .input('recipeId', sql.Int, parseInt(recipeId))
      .query('SELECT RECIPE_ID, TITLE FROM RECIPES WHERE RECIPE_ID = @recipeId');

    if (checkResult.recordset.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          message: 'Recipe not found',
          success: false
        })
      };
    }

    const recipeName = checkResult.recordset[0].TITLE;
    console.log(`Found recipe: "${recipeName}"`);

    // Delete the recipe
    const deleteResult = await pool.request()
      .input('recipeId', sql.Int, parseInt(recipeId))
      .query('DELETE FROM RECIPES WHERE RECIPE_ID = @recipeId');

    console.log(`Recipe "${recipeName}" (ID: ${recipeId}) deleted successfully`);
    console.log(`Rows affected: ${deleteResult.rowsAffected[0]}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Recipe deleted successfully',
        success: true,
        recipeId: parseInt(recipeId),
        recipeName: recipeName
      })
    };

  } catch (error) {
    console.error('Error deleting recipe:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      state: error.state
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Failed to delete recipe',
        error: error.message,
        details: error.code || 'Database error',
        success: false
      })
    };
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
};