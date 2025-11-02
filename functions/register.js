const sql = require('mssql');
const bcrypt = require('bcryptjs');
const dbConfig = require('../dbConfig');
require('dotenv').config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // ✅ Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { fullName, email, username, password } = body;

    // ✅ Validate input
    if (!fullName || !email || !username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'All fields are required' }),
      };
    }

    const pool = await sql.connect(dbConfig);

    // ✅ Check if username or email already exists
    const existingUser = await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .query(`
        SELECT * FROM USERS 
        WHERE USERNAME = @username OR EMAIL = @email
      `);

    if (existingUser.recordset.length > 0) {
      const existing = existingUser.recordset[0];
      let conflict = '';
      if (existing.USERNAME === username) conflict = 'Username';
      else if (existing.EMAIL === email) conflict = 'Email';

      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: `${conflict} already exists.` }),
      };
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert user
    await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, hashedPassword)
      .input('fullname', sql.VarChar, fullName)
      .input('email', sql.VarChar, email)
      .query(`
        INSERT INTO USERS (USERNAME, PASSWORD, FULLNAME, EMAIL)
        VALUES (@username, @password, @fullname, @email)
      `);

    // ✅ Optional welcome email
    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'My Favorite Recipes <support@myrecipes.app>',
            to: email,
            subject: 'Welcome to My Favorite Recipes 🍳',
            html: `
              <html>
                <body style="font-family: Poppins, sans-serif; background-color: #f4f7ff; padding: 20px;">
                  <div style="max-width:600px;margin:auto;background:white;padding:20px;border-radius:10px;">
                    <h2 style="color:#ff6347;">Welcome, ${fullName}!</h2>
                    <p>Your account has been created successfully 🎉</p>
                    <p>You can now log in and start sharing your favorite recipes!</p>
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
                    <p style="color:#999;">© ${new Date().getFullYear()} My Favorite Recipes</p>
                  </div>
                </body>
              </html>
            `
          })
        });
      } catch (emailErr) {
        console.warn("Email sending failed:", emailErr.message);
      }
    }

    // ✅ Return success response for frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Registration successful! Please login.' }),
    };

  } catch (err) {
    console.error("Registration error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error', error: err.message }),
    };
  }
};
