const sql = require('mssql');
const dbConfig = require('../dbConfig');
require('dotenv').config();

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body);
    const { userId, title, imageUrl, ingredients, steps } = body;

    // Simple validation
    if (!userId || !title || !ingredients || !steps) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'userId, title, ingredients, and steps are required' 
        }),
      };
    }

    // Connect to Azure SQL
    const pool = await sql.connect(dbConfig);
    
    // Insert recipe
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('title', sql.VarChar, title)
      .input('imageUrl', sql.VarChar, imageUrl || '')
      .input('ingredients', sql.Text, ingredients)
      .input('steps', sql.Text, steps)
      .query(`
        INSERT INTO RECIPES (USER_ID, TITLE, IMAGE_URL, INGREDIENTS, STEPS)
        OUTPUT INSERTED.RECIPE_ID, INSERTED.TITLE, INSERTED.IMAGE_URL, 
               INSERTED.INGREDIENTS, INSERTED.STEPS, INSERTED.CREATED_AT
        VALUES (@userId, @title, @imageUrl, @ingredients, @steps)
      `);

    const newRecipe = result.recordset[0];

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Recipe created successfully',
        recipe: {
          id: newRecipe.RECIPE_ID,
          title: newRecipe.TITLE,
          image: newRecipe.IMAGE_URL,
          ingredients: newRecipe.INGREDIENTS,
          steps: newRecipe.STEPS,
          createdAt: newRecipe.CREATED_AT
        }
      }),
    };

  } catch (err) {
    console.error("Create recipe error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Failed to create recipe',
        error: err.message
      }),
    };
  }
};