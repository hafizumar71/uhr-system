const { Sequelize, DataTypes } = require("sequelize")
const sequelize = require("../config/db") 
// Define the Role model with explicit table name
const Department = sequelize.define(
  "departments",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
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
    tableName: "departments",
  }
)

// Export the Role model
module.exports = Department
