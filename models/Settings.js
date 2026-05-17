const { Sequelize, DataTypes } = require("sequelize")
const sequelize = require("../config/db")  
const Role = require("./Role")

const Settings = sequelize.define(
    "user_settings",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        references: {
          model: Role,
          key: "role_id",
        },
      },
      setting_name: {
        type: DataTypes.STRING,
      },
      enabled: {
        type: DataTypes.INTEGER,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      createdby: {
        type: DataTypes.INTEGER,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      updatedby: {
        type: DataTypes.INTEGER,
      },
  },
    {
      tableName: "user_settings",
    }
  )
  
  Settings.belongsTo(Role, { foreignKey: "role_id" })
  // Export the Role model
  module.exports = Settings
  