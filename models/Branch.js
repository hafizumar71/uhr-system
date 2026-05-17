const { Sequelize, DataTypes } = require("sequelize")
const sequelize = require("../config/db") 
// Define the Role model with explicit table name
const Branch = sequelize.define(
  "branch",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    branch_name: {
      type: DataTypes.STRING,
    },
   
    contact_info: {
      type: DataTypes.STRING,
    },
    address: {
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
    tableName: "branch",
  }
)

// Export the Role model
module.exports = Branch
