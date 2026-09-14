module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('block_lists', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      report_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      last_reported: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      threat_level: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'low',
      },
      categories: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      first_reported: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

    // Indexes
    await queryInterface.addIndex('block_lists', ['phone_number']);
    await queryInterface.addIndex('block_lists', ['report_count']);
    await queryInterface.addIndex('block_lists', ['threat_level']);
    await queryInterface.addIndex('block_lists', ['last_reported']);
    await queryInterface.addIndex('block_lists', ['threat_level', 'report_count']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('block_lists');
  },
};
