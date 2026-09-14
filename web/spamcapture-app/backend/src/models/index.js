const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

// Import models
const UserModel = require('./user')(sequelize, DataTypes);
const SpamReportModel = require('./spamreport')(sequelize, DataTypes);
const BlockListModel = require('./blocklist')(sequelize, DataTypes);

// Define associations
// User has many SpamReports
UserModel.hasMany(SpamReportModel, {
  foreignKey: 'userId',
  as: 'reports',
  onDelete: 'SET NULL'
});
SpamReportModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'user'
});

// SpamReport references BlockList (via phoneNumber)
// This is a loose relationship based on phoneNumber
SpamReportModel.addHook('afterCreate', async (report) => {
  // Trigger block list aggregation after a report is created
  const BlockListService = require('../services/blocklist.service');
  await BlockListService.aggregateReport(report.phoneNumber);
});

const db = {
  sequelize,
  Sequelize,
  User: UserModel,
  SpamReport: SpamReportModel,
  BlockList: BlockListModel
};

module.exports = db;
