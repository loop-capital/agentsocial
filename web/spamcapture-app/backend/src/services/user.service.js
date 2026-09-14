const { User } = require('../models');
const { NotFoundError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   */
  static async createUser(userData) {
    // Generate anonymous ID if not provided
    const anonymousId = userData.anonymousId || this.generateAnonymousId();

    const user = await User.create({
      ...userData,
      anonymousId
    });

    return user;
  }

  /**
   * Get or create a user by anonymous ID
   * @param {string} anonymousId - Anonymous device identifier
   * @param {Object} additionalData - Additional user data
   */
  static async getOrCreateByAnonymousId(anonymousId, additionalData = {}) {
    let user = await User.findOne({
      where: { anonymousId }
    });

    if (!user) {
      user = await User.create({
        anonymousId,
        ...additionalData
      });
    } else if (Object.keys(additionalData).length > 0) {
      // Update user with new data if provided
      await user.update(additionalData);
    }

    return user;
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   */
  static async getUserById(id) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get user by anonymous ID
   * @param {string} anonymousId - Anonymous device identifier
   */
  static async getUserByAnonymousId(anonymousId) {
    const user = await User.findOne({
      where: { anonymousId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user device token
   * @param {string} id - User ID
   * @param {string} deviceToken - Push notification token
   */
  static async updateDeviceToken(id, deviceToken) {
    const user = await this.getUserById(id);
    await user.update({ deviceToken });
    return user;
  }

  /**
   * Generate a new anonymous ID
   */
  static generateAnonymousId() {
    return `anon_${uuidv4().replace(/-/g, '')}`;
  }

  /**
   * Get user statistics
   */
  static async getStats() {
    const totalUsers = await User.count();
    
    const usersWithDeviceToken = await User.count({
      where: { deviceToken: { [require('sequelize').Op.ne]: null } }
    });

    return {
      totalUsers,
      usersWithDeviceToken,
      usersWithoutDeviceToken: totalUsers - usersWithDeviceToken
    };
  }
}

module.exports = UserService;
