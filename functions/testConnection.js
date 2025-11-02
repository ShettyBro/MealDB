const sql = require('mssql');
const dbConfig = require('./dbConfig');

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT TOP 1 * FROM USERS");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Connected to Azure SQL successfully!",
        sample_user: result.recordset[0] || "No users found yet"
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Failed to connect to database",
        error: err.message
      })
    };
  }
};
