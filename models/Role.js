const { Sequelize, DataTypes } = require("sequelize")
const sequelize = require("../config/db") 

const Role = sequelize.define(
    "role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
      },
      permissions: {
        type: DataTypes.JSON,
        allowNull: true,
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
      tableName: "roles",
    }
  )
  


module.exports = Role
