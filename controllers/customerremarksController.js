const CustomerRemark = require("../models/CustomerRemark");
const Customer = require("../models/Customer")
const { Op, Sequelize } = require('sequelize');
const User = require("../models/User");
const Branch = require("../models/Branch");
const jwt = require("jsonwebtoken");

const addRemark = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userData = await User.findOne({ where: { id: decoded.userId } });



    const { loan_account_no, remark, reason } = req.body;

    if (!loan_account_no || !remark) {
      return res.status(400).json({ error: "Loan Account No and remark are required" });
    }

    const newRemark = await CustomerRemark.create({
      loan_account_no,
      remark,
      reason,
      remark_by: userData.full_name,
      user_id: userData.id,
      branch: userData.branch_ids, // optional
      createdAt: new Date()
    });

    res.status(200).json({
      message: "Remark added successfully",
      data: newRemark
    });

  } catch (error) {
    console.error("Error adding remark:", error);
    res.status(500).json({ error: error.message });
  }
};

const getCustomerRemarks = async (req, res) => {
  try {
    const { loan_account_no } = req.params;

    const remarks = await CustomerRemark.findAll({
      where: { loan_account_no },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      total: remarks.length,
      data: remarks
    });

  } catch (error) {
    console.error("Error fetching remarks:", error);
    res.status(500).json({ error: error.message });
  }
};



const getOverdueDashboard = async (req, res) => {
  try {

    const userData = await User.findOne({
      where: { id: req.user.userId },
      raw: true
    });

    if (!userData) {
      return res.status(401).json({ message: "User not found" });
    }

    const formatAmount = (num) => {
      if (!num) return "0";
      return Number(num).toLocaleString();
    };

    const parseBranchIds = (str) => {
      if (!str) return [];
      return str
        .replace(/[{}]/g, "")
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
    };

    let whereCondition = {};

    // ✅ ROLE FILTER
    if (userData.role_id !== 1) {
      const branchIds = parseBranchIds(userData.branch_ids);

      if (branchIds.length === 0) {
        whereCondition = { id: -1 }; // no data
      } else {
        const branches = await Branch.findAll({
          where: { id: { [Op.in]: branchIds } },
          attributes: ["branch_name"],
          raw: true,
        });

        const branchNames = branches.map((b) => b.branch_name);

        if (branchNames.length === 0) {
          whereCondition = { id: -1 };
        } else {
          whereCondition = {
            branch: {
              [Op.in]: branchNames,
            },
          };
        }
      }
    }

    // ✅ ALWAYS filter active customers
    whereCondition = {
      ...whereCondition,
      status: 1
    };

    // 1️⃣ Total Clients
    const totalClients = await Customer.count({ where: whereCondition });

    // 2️⃣ Total Disbursed
    const totalDisbursed = formatAmount(
      await Customer.sum("disbursed_amount", { where: whereCondition })
    );

    // 3️⃣ Total Overdue
    const totalOverdue = formatAmount(
      await Customer.sum("total_overdue", { where: whereCondition })
    );

    // 4️⃣ DPD Buckets
    const dpdData = await Customer.findAll({
      attributes: [
        [
          Sequelize.literal(`
            CASE 
              WHEN dpd BETWEEN 0 AND 29 THEN '0-29'
              WHEN dpd BETWEEN 30 AND 59 THEN '30-59'
              WHEN dpd BETWEEN 60 AND 89 THEN '60-89'
              WHEN dpd BETWEEN 90 AND 179 THEN '90-179'
              ELSE '180+'
            END
          `),
          "dpd_bucket",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        [Sequelize.fn("SUM", Sequelize.col("total_overdue")), "amount"],
      ],
      where: whereCondition,
      group: ["dpd_bucket"],
      raw: true,
    });

    const dpdBuckets = {
      "0-29": { count: 0, amount: 0 },
      "30-59": { count: 0, amount: 0 },
      "60-89": { count: 0, amount: 0 },
      "90-179": { count: 0, amount: 0 },
      "180+": { count: 0, amount: 0 },
    };

    dpdData.forEach((b) => {
      dpdBuckets[b.dpd_bucket] = {
        count: parseInt(b.count),
        amount: formatAmount(b.amount),
      };
    });

    // 5️⃣ Remarks (FIXED ✅)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // 👉 First get active loan_account_no list
    const activeLoans = await Customer.findAll({
      attributes: ["loan_account_no"],
      where: whereCondition,
      raw: true,
    });

    const loanIds = activeLoans.map(c => c.loan_account_no);

    let remarksAdded = 0;

    if (loanIds.length > 0) {
      remarksAdded = await CustomerRemark.count({
        where: {
          createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
          loan_account_no: {
            [Op.in]: loanIds
          },
        },
        distinct: true,
        col: "loan_account_no",
      });
    }

    // 6️⃣ Monthly Trend
    const monthlyTrend = await Customer.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%Y-%m"), "month"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total_clients"],
        [Sequelize.fn("SUM", Sequelize.col("total_overdue")), "total_overdue"],
      ],
      where: whereCondition,
      group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%Y-%m")],
      order: [[Sequelize.literal("month"), "ASC"]],
      raw: true,
    });

    res.json({
      total_clients: totalClients,
      total_disbursed: totalDisbursed,
      total_overdue: totalOverdue,
      remarks_added: remarksAdded,
      dpd_buckets: dpdBuckets,
      monthly_trend: monthlyTrend,
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



const getBranchWiseReport = async (req, res) => {
  try {

    const userData = await User.findOne({
      where: { id: req.user.userId },
      raw: true,
    });

    if (!userData) return res.status(401).json({ message: "User not found" });

    const parseBranchIds = (str) => {
      if (!str) return [];
      return str.replace(/[{}]/g, "").split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    };

    let whereCondition = {};
    if (userData.role_id !== 1) {
      const branchIds = parseBranchIds(userData.branch_ids);
      if (branchIds.length === 0) return res.json([]);

      const branches = await Branch.findAll({
        where: { id: { [Op.in]: branchIds } },
        attributes: ["branch_name"],
        raw: true,
      });

      const branchNames = branches.map(b => b.branch_name);
      if (branchNames.length === 0) return res.json([]);
      whereCondition = { branch: { [Op.in]: branchNames } };
    }

    // Current month start & end
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const report = await Customer.findAll({
      where: {
        ...whereCondition,
        status: 1
      },
      attributes: [
        "branch",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total_clients"],

        // Clients visited in current month
        [Sequelize.literal(`(
          SELECT COUNT(DISTINCT cr.loan_account_no)
          FROM customers_risk AS cr
          WHERE cr.loan_account_no IN (
            SELECT c.loan_account_no
            FROM customers AS c
            WHERE c.branch = Customer.branch AND c.status = 1
          )
          AND cr.createdAt BETWEEN '${currentMonthStart.toISOString()}' AND '${currentMonthEnd.toISOString()}'
        )`), "client_visited"],

        // Pending = total active clients - visited this month
        [Sequelize.literal(`COUNT(id) - (
          SELECT COUNT(DISTINCT cr.loan_account_no)
          FROM customers_risk AS cr
          WHERE cr.loan_account_no IN (
            SELECT c.loan_account_no
            FROM customers AS c
            WHERE c.branch = Customer.branch AND c.status = 1
          )
          AND cr.createdAt BETWEEN '${currentMonthStart.toISOString()}' AND '${currentMonthEnd.toISOString()}'
        )`), "pending"],

        // DPD Buckets remain same
        [
          Sequelize.literal(`CONCAT(
            SUM(CASE WHEN dpd BETWEEN 0 AND 29 THEN 1 ELSE 0 END),
            ' / ',
            SUM(CASE WHEN dpd BETWEEN 0 AND 29 THEN total_overdue ELSE 0 END)
          )`),
          "dpd_0_29"
        ],
        [
          Sequelize.literal(`CONCAT(
            SUM(CASE WHEN dpd BETWEEN 30 AND 59 THEN 1 ELSE 0 END),
            ' / ',
            SUM(CASE WHEN dpd BETWEEN 30 AND 59 THEN total_overdue ELSE 0 END)
          )`),
          "dpd_30_59"
        ],
        [
          Sequelize.literal(`CONCAT(
            SUM(CASE WHEN dpd BETWEEN 60 AND 89 THEN 1 ELSE 0 END),
            ' / ',
            SUM(CASE WHEN dpd BETWEEN 60 AND 89 THEN total_overdue ELSE 0 END)
          )`),
          "dpd_60_89"
        ],
        [
          Sequelize.literal(`CONCAT(
            SUM(CASE WHEN dpd BETWEEN 90 AND 179 THEN 1 ELSE 0 END),
            ' / ',
            SUM(CASE WHEN dpd BETWEEN 90 AND 179 THEN total_overdue ELSE 0 END)
          )`),
          "dpd_90_179"
        ],
        [
          Sequelize.literal(`CONCAT(
            SUM(CASE WHEN dpd >= 180 THEN 1 ELSE 0 END),
            ' / ',
            SUM(CASE WHEN dpd >= 180 THEN total_overdue ELSE 0 END)
          )`),
          "dpd_180"
        ]
      ],
      group: ["branch"],
      order: [["branch", "ASC"]],
      raw: true
    });

    res.json(report);

  } catch (error) {
    console.error("Branch Report Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getLoanReport = async (req, res) => {
  try {
    // 1️⃣ Calculate current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 2️⃣ Fetch all remarks added in the current month
    const currentMonthRemarks = await CustomerRemark.findAll({
      where: {
        createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
      },
      attributes: ["loan_account_no", "remark", "reason", "remark_by", "createdAt"],
      order: [["createdAt", "ASC"]],
      raw: true,
    });

    if (currentMonthRemarks.length === 0) return res.json([]); // no data

    // 3️⃣ Collect all loan_account_no that have remarks
    const loanAccountNosWithRemarks = [...new Set(currentMonthRemarks.map(r => r.loan_account_no))];

    // 4️⃣ Fetch loan details for these accounts
    const loans = await Customer.findAll({
      where: {
        loan_account_no: { [Op.in]: loanAccountNosWithRemarks }
      },
      attributes: [
        "branch",
        "client_name",
        "loan_account_no",
        "cluster",
        "group_name",
        "cnic_no",
        "disbursed_amount",
        "total_overdue",
        "createdAt",
        [Sequelize.literal(`
          CASE 
            WHEN dpd BETWEEN 0 AND 29 THEN '0-29'
            WHEN dpd BETWEEN 30 AND 59 THEN '30-59'
            WHEN dpd BETWEEN 60 AND 89 THEN '60-89'
            WHEN dpd BETWEEN 90 AND 179 THEN '90-179'
            ELSE '180+'
          END
        `), "dpd_bucket"]
      ],
      raw: true,
      order: [["createdAt", "DESC"]],
    });

    // 5️⃣ Group remarks by loan_account_no
    const remarksMap = {};
    currentMonthRemarks.forEach(r => {
      if (!remarksMap[r.loan_account_no]) remarksMap[r.loan_account_no] = [];
      remarksMap[r.loan_account_no].push(r);
    });

    // 6️⃣ Build final rows
    const finalData = loans.map(loan => {
      const loanRemarks = remarksMap[loan.loan_account_no] || [];

      const row = {
        branch: loan.branch,
        client_name: loan.client_name,
        dpd_bucket: loan.dpd_bucket,
        loan_account_no: loan.loan_account_no,
        cluster: loan.cluster || "-",
        group_name: loan.group_name || "-",
        cnic_no: loan.cnic_no || "-",
        disbursed_amount: loan.disbursed_amount || "-",
        total_overdue: loan.total_overdue || "-",
        loan_date: loan.createdAt ? new Date(loan.createdAt).toISOString().split("T")[0] : "-",
      };

      // Add dynamic visits: as many as remarks exist
      loanRemarks.forEach((r, index) => {
        row[`visit_${index + 1}_name`] = r.remark_by || "-";
        row[`visit_${index + 1}_reason`] = r.reason || "-";
        row[`visit_${index + 1}_remark`] = r.remark || "-";
        row[`visit_${index + 1}_date`] = r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "-";
      });

      return row;
    });

    res.status(200).json(finalData);

  } catch (error) {
    console.error("Loan Report Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




const getPendingClientsReport = async (req, res) => {
  try {
    // 1️⃣ Current month start and end
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 2️⃣ Get all loan accounts with remarks in the current month ONLY
    const currentMonthRemarks = await CustomerRemark.findAll({
      attributes: ["loan_account_no"],
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      raw: true
    });

    const loanAccountNosWithCurrentMonthRemarks = new Set(
      currentMonthRemarks.map(r => r.loan_account_no)
    );

    // 3️⃣ Fetch all active customers and filter out only those who had remarks this month
    const allActiveCustomers = await Customer.findAll({
      where: {
        status: 1 // only active
      },
      attributes: [
        "branch",
        "client_name",
        "loan_account_no",
        "cluster",
        "group_name",
        "cnic_no",
        "disbursed_amount",
        "total_overdue",
        "createdAt",
        [Sequelize.literal(`
          CASE 
            WHEN dpd BETWEEN 0 AND 29 THEN '0-29'
            WHEN dpd BETWEEN 30 AND 59 THEN '30-59'
            WHEN dpd BETWEEN 60 AND 89 THEN '60-89'
            WHEN dpd BETWEEN 90 AND 179 THEN '90-179'
            ELSE '180+'
          END
        `), "dpd_bucket"]
      ],
      raw: true,
      order: [["createdAt", "DESC"]]
    });

    // 4️⃣ Filter out only those who have NO current month remarks
    const pendingLoans = allActiveCustomers.filter(
      c => !loanAccountNosWithCurrentMonthRemarks.has(c.loan_account_no)
    );

    // 5️⃣ Build final response
    const finalData = pendingLoans.map(loan => ({
      branch: loan.branch,
      client_name: loan.client_name,
      dpd_bucket: loan.dpd_bucket,
      loan_account_no: loan.loan_account_no,
      cluster: loan.cluster || "-",
      group_name: loan.group_name || "-",
      cnic_no: loan.cnic_no || "-",
      disbursed_amount: loan.disbursed_amount || "-",
      total_overdue: loan.total_overdue || "-",
      loan_date: loan.createdAt ? new Date(loan.createdAt).toISOString().split("T")[0] : "-"
    }));

    res.status(200).json(finalData);

  } catch (error) {
    console.error("Pending Clients Report Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




module.exports = {
  addRemark,
  getCustomerRemarks,
  getOverdueDashboard,
  getBranchWiseReport,
  getLoanReport,
  getPendingClientsReport
};