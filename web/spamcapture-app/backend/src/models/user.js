module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    anonymousId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: 'Anonymous device identifier'
    },
    deviceToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Push notification token'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        fields: ['anonymousId'],
        unique: true
      }
    ]
  });

  return User;
};
