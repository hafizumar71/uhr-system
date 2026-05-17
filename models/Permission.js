const { Sequelize, DataTypes } = require("sequelize")
const sequelize = require("../config/db") 

const Permission = sequelize.define(
    "permissions",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      permission_name: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.STRING,
      },
      status: {
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
      tableName: "permissions",
    }
  )
  
  // Export the Role model
  module.exports = Permission
  
