module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      anonymous_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        unique: true,
      },
      device_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      spamsuit_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add index on anonymous_id for faster lookups
    await queryInterface.addIndex('users', ['anonymous_id']);
    await queryInterface.addIndex('users', ['spamsuit_id'], {
      unique: true,
      where: { spamsuit_id: { [Sequelize.Op.ne]: null } },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  },
};
