// createRecipe.js

const sql = require('mssql');
const jwt = require('jsonwebtoken');
const multiparty = require('multiparty');
const { BlobServiceClient } = require('@azure/storage-blob');
const dbConfig = require('../dbConfig');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // Verify JWT token
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: "Missing token" }) };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: "Invalid or expired token" }) };
    }

    // Parse form data (multipart/form-data)
    const form = new multiparty.Form();
    const formData = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const title = fields.title?.[0];
    const ingredients = fields.ingredients?.[0];
    const steps = fields.steps?.[0];
    const imageFile = files.image?.[0];

    if (!title || !ingredients || !steps || !imageFile) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "All fields including image are required" }),
      };
    }

    // Upload image to Azure Blob
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    const blobName = `${Date.now()}-${imageFile.originalFilename}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const fs = require('fs');
    const fileStream = fs.createReadStream(imageFile.path);

    await blockBlobClient.uploadStream(fileStream);
    const imageUrl = blockBlobClient.url;

    // Insert into SQL
    const pool = await sql.connect(dbConfig);
    const insertQuery = `
      INSERT INTO RECIPES (USER_ID, TITLE, IMAGE_URL, INGREDIENTS, STEPS)
      OUTPUT INSERTED.RECIPE_ID
      VALUES (@userId, @title, @imageUrl, @ingredients, @steps)
    `;

    const result = await pool.request()
      .input('userId', sql.Int, decoded.id)
      .input('title', sql.VarChar, title.toUpperCase())
      .input('imageUrl', sql.VarChar, imageUrl)
      .input('ingredients', sql.Text, ingredients)
      .input('steps', sql.Text, steps)
      .query(insertQuery);

    const newRecipeId = result.recordset[0].RECIPE_ID;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Recipe added successfully!",
        recipeId: newRecipeId,
        imageUrl
      }),
    };
  } catch (err) {
    console.error("Create recipe error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error", error: err.message }),
    };
  }
};
