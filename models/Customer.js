const { Sequelize, DataTypes } = require("sequelize")
const sequelize = require("../config/db")

const Customer = sequelize.define(
  "customer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    area_no: {
      type: DataTypes.STRING,
    },

    branch: {
      type: DataTypes.STRING,
    },

    cluster: {
      type: DataTypes.STRING,
    },

    group_name: {
      type: DataTypes.STRING,
    },

    loan_account_no: {
      type: DataTypes.STRING,
      unique: true, // IMPORTANT: your unique identifier
    },

    client_name: {
      type: DataTypes.STRING,
    },

    cnic_no: {
      type: DataTypes.STRING,
    },

    mobile_no: {
      type: DataTypes.STRING,
    },

    father_husband_name: {
      type: DataTypes.STRING,
    },
status: {
      type: DataTypes.INTEGER,
    },
    guarantor_name: {
      type: DataTypes.STRING,
    },

    guarantor_contact: {
      type: DataTypes.STRING,
    },

    area: {
      type: DataTypes.STRING,
    },

    permanent_address: {
      type: DataTypes.TEXT,
    },

    disbursal_date: {
      type: DataTypes.DATE,
    },

    disbursed_amount: {
      type: DataTypes.DECIMAL(15, 2),
    },

    total_overdue: {
      type: DataTypes.DECIMAL(15, 2),
    },

    last_payment_date: {
      type: DataTypes.DATE,
    },

    last_payment_amount: {
      type: DataTypes.DECIMAL(15, 2),
    },

    due_date: {
      type: DataTypes.DATE,
    },

    dpd: {
      type: DataTypes.INTEGER,
    },

    upload_month: {
      type: DataTypes.STRING, // e.g. "2026-03"
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
    tableName: "customers",
  }
)

module.exports = Customer