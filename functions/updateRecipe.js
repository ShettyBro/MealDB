const sql = require('mssql');
const { BlobServiceClient } = require('@azure/storage-blob');

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

// Azure Blob Storage Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'recipe-images';

// Upload image to Azure Blob Storage
async function uploadImageToBlob(base64Image, filename) {
  try {
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }

    console.log('Starting blob upload...');

    // Parse base64 image
    let base64Data, contentType;
    
    if (base64Image.includes(',')) {
      const parts = base64Image.split(',');
      contentType = parts[0].split(':')[1].split(';')[0];
      base64Data = parts[1];
    } else {
      base64Data = base64Image;
      contentType = 'image/jpeg';
    }

    const buffer = Buffer.from(base64Data, 'base64');
    
    if (buffer.length === 0) {
      throw new Error('Invalid image data');
    }

    console.log(`Image size: ${buffer.length} bytes`);

    // Create BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Ensure container exists
    await containerClient.createIfNotExists({ access: 'blob' });

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const blobName = `${timestamp}-${random}-${filename}`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: contentType }
    });

    console.log('Image uploaded successfully:', blockBlobClient.url);
    return blockBlobClient.url;
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
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

    // Parse request body
    const body = JSON.parse(event.body);
    const { title, ingredients, steps, imageBase64 } = body;

    // Validation
    if (!title || !ingredients || !steps) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'Title, ingredients, and steps are required',
          success: false
        })
      };
    }

    console.log(`Updating recipe ID: ${recipeId}`);

    // Connect to database
    pool = await sql.connect(config);

    // Check if recipe exists
    const checkResult = await pool.request()
      .input('recipeId', sql.Int, parseInt(recipeId))
      .query('SELECT RECIPE_ID, IMAGE_URL FROM RECIPES WHERE RECIPE_ID = @recipeId');

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

    const currentImageUrl = checkResult.recordset[0].IMAGE_URL;
    let newImageUrl = currentImageUrl; // Keep existing by default

    // Upload new image if provided
    if (imageBase64) {
      try {
        console.log('New image provided, uploading...');
        const filename = `recipe-${recipeId}-updated.jpg`;
        newImageUrl = await uploadImageToBlob(imageBase64, filename);
        console.log('New image URL:', newImageUrl);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            message: 'Failed to upload new image',
            error: uploadError.message,
            success: false
          })
        };
      }
    }

    // Update recipe in database
    const updateResult = await pool.request()
      .input('recipeId', sql.Int, parseInt(recipeId))
      .input('title', sql.VarChar, title)
      .input('imageUrl', sql.VarChar, newImageUrl)
      .input('ingredients', sql.Text, ingredients)
      .input('steps', sql.Text, steps)
      .query(`
        UPDATE RECIPES 
        SET 
          TITLE = @title,
          IMAGE_URL = @imageUrl,
          INGREDIENTS = @ingredients,
          STEPS = @steps,
          UPDATED_AT = GETDATE()
        WHERE RECIPE_ID = @recipeId
      `);

    console.log(`Recipe ${recipeId} updated successfully`);
    console.log(`Rows affected: ${updateResult.rowsAffected[0]}`);

    // Fetch updated recipe
    const updatedRecipe = await pool.request()
      .input('recipeId', sql.Int, parseInt(recipeId))
      .query(`
        SELECT 
          RECIPE_ID as id,
          TITLE as title,
          IMAGE_URL as image,
          INGREDIENTS as ingredients,
          STEPS as steps,
          CREATED_AT as createdAt,
          UPDATED_AT as updatedAt
        FROM RECIPES
        WHERE RECIPE_ID = @recipeId
      `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Recipe updated successfully',
        success: true,
        recipe: updatedRecipe.recordset[0]
      })
    };

  } catch (error) {
    console.error('Error updating recipe:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      state: error.state
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Failed to update recipe',
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