const sql = require('mssql');
const { BlobServiceClient } = require('@azure/storage-blob');
const dbConfig = require('../dbConfig');
require('dotenv').config();

// Azure Blob Storage Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'recipe-images'; // Your container name

// Upload image to Azure Blob Storage
async function uploadImageToBlob(base64Image, filename) {
  try {
    // Remove base64 prefix (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Generate unique filename
    const timestamp = Date.now();
    const blobName = `${timestamp}-${filename}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Determine content type from base64 prefix
    const contentType = base64Image.split(';')[0].split(':')[1];

    // Upload buffer to blob
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: contentType }
    });

    // Return public URL
    return blockBlobClient.url;
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new Error('Failed to upload image');
  }
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body);
    const { userId, title, imageBase64, ingredients, steps } = body;

    // Validation
    if (!userId || !title || !ingredients || !steps) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'userId, title, ingredients, and steps are required' 
        }),
      };
    }

    let imageUrl = '';

    // Upload image to Azure Blob if provided
    if (imageBase64) {
      try {
        const filename = `recipe-${userId}-${Date.now()}.jpg`;
        imageUrl = await uploadImageToBlob(imageBase64, filename);
        console.log('Image uploaded to blob:', imageUrl);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            message: 'Failed to upload image',
            error: uploadError.message 
          }),
        };
      }
    }

    // Connect to Azure SQL
    const pool = await sql.connect(dbConfig);
    
    // Insert recipe with blob URL
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('title', sql.VarChar, title)
      .input('imageUrl', sql.VarChar, imageUrl)
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