const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CustomerRemark = sequelize.define("customer_remark", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    loan_account_no: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    remark: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

      reason: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    remark_by: {
        type: DataTypes.STRING, // username or full_name
        allowNull: false,
    },

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    branch: {
        type: DataTypes.STRING,
    },

    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },

    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
    
},
  {
    tableName: "customers_risk",
  });

module.exports = CustomerRemark;