const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbConfig = require('../dbConfig');
require('dotenv').config();
const crypto = require('crypto');

const JWT_SECRET = process.env.SECRET_KEY;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');


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

   // Sign with explicit claims (still UTC)
    const token = jwt.sign(
      { sub: String(user.USER_ID), username: user.USERNAME },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '5h',
        issuer: 'mealdbs.netlify.app',    // adjust
        audience: 'mealdbs:web'           // adjust
      }
    );

    const { exp } = jwt.decode(token); // seconds since epoch (UTC)
    const tokenExpiration = exp * 1000; // ms

    // // ✅ Respond with token + user details
    // // Compute expiration time (ms) from the JWT 'exp' claim, fallback to 5 hours
    // const decoded = jwt.decode(token);
    // const tokenExpiration = decoded && decoded.exp
    //   ? decoded.exp * 1000
    //   : Date.now() + 5 * 60 * 60 * 1000;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
      message: 'Login successful',
      token,
      name: user.FULLNAME,
      email: user.EMAIL,
      tokenExpiration, // milliseconds timestamp for frontend
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
