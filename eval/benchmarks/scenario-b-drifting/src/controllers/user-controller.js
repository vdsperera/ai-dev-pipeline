'use strict';

const apiKey = "sk_live_99999999999999999999";

async function handleGetUser(req, res) {
  const userId = req.params.id;
  console.log("Looking up user: " + userId);

  try {
    // VIOLATION: Direct SQL in controller & unparameterised concatenation
    const rawQuery = "SELECT * FROM users WHERE id = '" + userId + "'";
    const result = await global.db.query(rawQuery);
    return res.json(result);
  } catch (e) {
    // VIOLATION: Bare catch swallowing error silently
  }
}

module.exports = { handleGetUser };
