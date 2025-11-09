const sql = require('mssql');
const { BlobServiceClient } = require('@azure/storage-blob');
const dbConfig = require('../dbConfig');
require('dotenv').config();

// Azure Blob Storage Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'recipe-images'; // Make sure this container exists!

// Upload image to Azure Blob Storage
async function uploadImageToBlob(base64Image, filename) {
  try {
    // Validate connection string
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }

    // Parse base64 image
    let base64Data, contentType;
    
    if (base64Image.includes(',')) {
      // Format: "data:image/jpeg;base64,/9j/4AAQ..."
      const parts = base64Image.split(',');
      contentType = parts[0].split(':')[1].split(';')[0];
      base64Data = parts[1];
    } else {
      // Raw base64 without prefix
      base64Data = base64Image;
      contentType = 'image/jpeg'; // Default
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate buffer
    if (buffer.length === 0) {
      throw new Error('Invalid image data - empty buffer');
    }

    console.log(`Uploading image: ${filename}, Size: ${buffer.length} bytes, Type: ${contentType}`);

    // Create BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Ensure container exists (create if not)
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access for blobs
    });

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const blobName = `${timestamp}-${random}-${filename}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload buffer to blob
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { 
        blobContentType: contentType 
      }
    });

    console.log('Image uploaded successfully:', blockBlobClient.url);

    // Return public URL
    return blockBlobClient.url;
  } catch (error) {
    console.error('Blob upload error details:', error);
    throw new Error(`Blob upload failed: ${error.message}`);
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

  let pool;

  try {
    const body = JSON.parse(event.body);
    const { userId, title, imageBase64, ingredients, steps } = body;

    console.log('Received create recipe request for userId:', userId);

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
        console.log('Starting image upload...');
        const filename = `recipe-${userId}-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
        imageUrl = await uploadImageToBlob(imageBase64, filename);
        console.log('Image URL:', imageUrl);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError.message);
        
        // Return detailed error for debugging
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            message: 'Failed to upload image',
            error: uploadError.message,
            details: 'Check Azure Storage connection string and container permissions'
          }),
        };
      }
    }

    // Connect to Azure SQL
    console.log('Connecting to database...');
    pool = await sql.connect(dbConfig);
    
    // Insert recipe with blob URL
    console.log('Inserting recipe into database...');
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

    console.log('Recipe created successfully:', newRecipe.RECIPE_ID);

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
        error: err.message,
        details: err.stack
      }),
    };
  } finally {
    // Close database connection
    if (pool) {
      await pool.close();
    }
  }
};