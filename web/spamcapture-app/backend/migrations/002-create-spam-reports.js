module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('spam_reports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      caller_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('sms', 'call'),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      screenshot_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('spam', 'scam', 'phishing', 'robocall', 'telemarketing', 'other'),
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      device_info: {
        type: Sequelize.JSONB,
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

    // Indexes for efficient queries
    await queryInterface.addIndex('spam_reports', ['phone_number']);
    await queryInterface.addIndex('spam_reports', ['type']);
    await queryInterface.addIndex('spam_reports', ['category']);
    await queryInterface.addIndex('spam_reports', ['timestamp']);
    await queryInterface.addIndex('spam_reports', ['user_id']);
    await queryInterface.addIndex('spam_reports', ['created_at']);
    
    // Composite index for common query patterns
    await queryInterface.addIndex('spam_reports', ['phone_number', 'type']);
    await queryInterface.addIndex('spam_reports', ['phone_number', 'type', 'category']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('spam_reports');
  },
};
