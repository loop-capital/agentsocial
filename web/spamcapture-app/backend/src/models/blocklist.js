module.exports = (sequelize, DataTypes) => {
  const BlockList = sequelize.define('BlockList', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [7, 20]
      }
    },
    reportCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    lastReported: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    threatLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'low',
      validate: {
        isIn: [['low', 'medium', 'high', 'critical']]
      }
    }
  }, {
    tableName: 'block_list',
    timestamps: true,
    indexes: [
      {
        fields: ['phoneNumber'],
        unique: true
      },
      {
        fields: ['reportCount']
      },
      {
        fields: ['threatLevel']
      },
      {
        fields: ['lastReported']
      },
      {
        fields: ['reportCount', 'threatLevel']
      }
    ]
  });

  return BlockList;
};
