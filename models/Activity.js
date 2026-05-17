const { Sequelize, DataTypes } = require("sequelize")
const sequelize = require("../config/db") 
// Define the Role model with explicit table name
const Activity = sequelize.define(
  "activity_logs",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    activity_name: {
      type: DataTypes.STRING,
    },

    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
    created_by: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "activity_logs",
  }
)

// Export the Role model
module.exports = Activity
