module.exports = (sequelize, DataTypes) => {
  const SpamReport = sequelize.define('SpamReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [7, 20]
      },
      comment: 'The reported phone number'
    },
    callerId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Caller ID name if available'
    },
    type: {
      type: DataTypes.ENUM('sms', 'call'),
      allowNull: false,
      validate: {
        isIn: [['sms', 'call']]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Content of the spam message or call transcript'
    },
    screenshotUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      },
      comment: 'URL to screenshot of spam message'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Spam category (e.g., phishing, scam, telemarketing)'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Optional location data (latitude, longitude, accuracy)'
    }
  }, {
    tableName: 'spam_reports',
    timestamps: true,
    indexes: [
      {
        fields: ['phoneNumber']
      },
      {
        fields: ['type']
      },
      {
        fields: ['category']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['phoneNumber', 'timestamp']
      }
    ]
  });

  return SpamReport;
};
