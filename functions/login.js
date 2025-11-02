const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbConfig = require('../dbConfig');
require('dotenv').config();

// Use a fixed secret from environment (.env)
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight OPTIONS request (CORS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { username, password } = body;

    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Username and password are required' }),
      };
    }

    // Connect to Azure SQL
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM USERS WHERE USERNAME = @username');

    if (result.recordset.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Invalid username or password' }),
      };
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.PASSWORD);

    if (!isMatch) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Invalid username or password' }),
      };
    }

    // ✅ Generate JWT (5-hour expiry)
    const token = jwt.sign(
      { id: user.USER_ID, username: user.USERNAME },
      JWT_SECRET,
      { expiresIn: '5h' }
    );

    // ✅ Respond with token + user details
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        token,
        name: user.FULLNAME,
        email: user.EMAIL,
      }),
    };

  } catch (err) {
    console.error("Login error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Internal server error',
        error: err.message,
      }),
    };
  }
};
