'use strict';

class UserService {
  constructor(dbPool, logger) {
    this.dbPool = dbPool;
    this.logger = logger;
  }

  async getUserById(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID provided');
    }

    try {
      this.logger.info({ operation: 'getUserById', userId }, 'Fetching user');
      const query = 'SELECT id, email, created_at FROM users WHERE id = $1';
      const result = await this.dbPool.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (err) {
      this.logger.error({ operation: 'getUserById', userId, error: err.message }, 'Failed to fetch user');
      throw new Error(`Database error while fetching user: ${err.message}`);
    }
  }
}

module.exports = UserService;
