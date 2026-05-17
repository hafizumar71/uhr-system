const Customer = require("../models/Customer");
const User = require("../models/User");
const Branch = require("../models/Branch");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
// Helper function to convert Excel serial date to JS Date
// Helper function to convert Excel serial date to JS Date
function excelDateToJSDate(serial) {
    if (!serial) return null;
    const utc_days = serial - 25569;
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

const uploadLoansExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Excel file is required." });
        }

        const filePath = path.resolve(req.file.path);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Trim keys
        const trimmedData = data.map(row => {
            const newRow = {};
            for (let key in row) newRow[key.trim()] = row[key];
            return newRow;
        });

        console.log("Total Excel rows:", trimmedData.length);

        // ✅ Clean + unique Loan IDs
        const excelLoanIds = [...new Set(
            trimmedData
                .map(row => String(row["Loan Account No."]).trim())
                .filter(id => id && id !== "undefined")
        )];

        console.log("Unique Loan IDs:", excelLoanIds.length);

        // Fetch existing customers
        const existingCustomers = await Customer.findAll({
            where: { loan_account_no: excelLoanIds },
        });

        const existingLoanMap = {};
        existingCustomers.forEach(cust => {
            existingLoanMap[cust.loan_account_no] = cust;
        });

        let insertedCount = 0;
        let updatedCount = 0;

        // Track duplicates inside Excel
        const processed = new Set();

        for (let row of trimmedData) {

            const loan_account_no = String(row["Loan Account No."]).trim();

            if (!loan_account_no) {
                console.log("Skipping empty Loan Account No");
                continue;
            }

            // ✅ Skip duplicate rows in Excel
            if (processed.has(loan_account_no)) {
                console.log("Duplicate skipped:", loan_account_no);
                continue;
            }
            processed.add(loan_account_no);

            // CNIC validation
            const cnic = row["CNIC No"] || "";
            if (cnic && !/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
                console.log(`Invalid CNIC skipped: ${loan_account_no}`);
                continue;
            }

            const customerData = {
                area_no: row["Area No"] || "",
                branch: row["Branch"] || "",
                cluster: row["Cluster"] || "",
                group_name: row["Group Name"] || "",
                client_name: row["Client Name"] || "",
                cnic_no: cnic,
                mobile_no: row["Mobile No."] || "",
                father_husband_name: row["Father / Husband Name"] || "",
                guarantor_name: row["Guarantor Name"] || "",
                guarantor_contact: row["Guarantor Contact"] || "",
                area: row["Area"] || "",
                permanent_address: row["Permanent Address"] || "",
                disbursal_date: excelDateToJSDate(row["Disbursal Date"]),
                disbursed_amount: row["Disbursed Amount"] || 0,
                total_overdue: row["Total OverDue"] || 0,
                last_payment_amount: row["Last Payment Amount"] || 0,
                last_payment_date: excelDateToJSDate(row["Last Payment Date"]),
                due_date: excelDateToJSDate(row["Due Date"]),
                dpd: row["DPDs"] || 0,
                follow_up_date: row["Follow-up Date"] || "",
                remarks: row["Remarks"] || "",
                upload_month: row["Upload Month"] || "",
                status: 1, // ✅ active since present in Excel
                updatedAt: new Date(),
            };

            if (existingLoanMap[loan_account_no]) {
                await Customer.update(customerData, {
                    where: { loan_account_no }
                });
                updatedCount++;
            } else {
                await Customer.create({
                    loan_account_no,
                    createdAt: new Date(),
                    ...customerData,
                });
                insertedCount++;
            }
        }

        // ✅ Deactivate customers NOT in current Excel
        if (excelLoanIds.length > 0) {
            await Customer.update(
                { status: 0 },
                {
                    where: {
                        loan_account_no: {
                            [Op.notIn]: excelLoanIds
                        }
                    }
                }
            );
        }

        fs.unlinkSync(filePath);

        res.status(200).json({
            message: "Customers processed successfully.",
            total_excel_rows: trimmedData.length,
            unique_loans: excelLoanIds.length,
            inserted: insertedCount,
            updated: updatedCount,
        });

    } catch (error) {
        console.error("Error uploading customers:", error);
        res.status(500).json({ error: error.message });
    }
};

const getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            where: {
                status: 1   // ✅ Only active customers
            },
            order: [["last_payment_date", "DESC"]],
        });

        res.status(200).json({
            message: "Customers fetched successfully.",
            total: customers.length,
            data: customers,
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: error.message });
    }
};



const getCustomersByUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        // Decode token to get user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ where: { id: decoded.userId } });
        if (!user) return res.status(401).json({ error: "User not found" });

        let customers = [];

        // Parse branch IDs
        let branchIds = user.branch_ids
            ? user.branch_ids.replace(/\n/g, "").replace(/{|}/g, "").split(",").map(Number)
            : [];

        if (branchIds.length === 0) {
            // ✅ No branch restriction → fetch all ACTIVE customers
            customers = await Customer.findAll({
                where: { status: 1 },
                order: [["last_payment_date", "DESC"]],
            });
        } else {
            // Get branch names
            const branches = await Branch.findAll({ where: { id: branchIds } });
            const branchNames = branches.map(b => b.branch_name);

            // ✅ Fetch ACTIVE customers for user's branches
            customers = await Customer.findAll({
                where: {
                    branch: branchNames,
                    status: 1
                },
                order: [["last_payment_date", "DESC"]],
            });
        }

        res.status(200).json({
            message: "Customers fetched successfully",
            total: customers.length,
            data: customers
        });

    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateMobile = async (req, res) => {
    try {
        const { loan_account_no, mobile_no, permanent_address } = req.body;

        // 🔴 Validation: loan_account_no is required
        if (!loan_account_no) {
            return res.status(400).json({
                success: false,
                message: "loan_account_no is required"
            });
        }

        // 🔍 Check if customer exists
        const customer = await Customer.findOne({
            where: { loan_account_no }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // 🧠 Prepare dynamic update object
        let updateData = {};

        if (mobile_no !== undefined && mobile_no !== null && mobile_no !== "") {
            updateData.mobile_no = mobile_no;
        }

        if (permanent_address !== undefined && permanent_address !== null && permanent_address !== "") {
            updateData.permanent_address = permanent_address;
        }

        // ⚠️ If nothing to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided to update"
            });
        }

        // 📝 Update record
        await Customer.update(updateData, {
            where: { loan_account_no }
        });

        // 🔄 Fetch updated record (optional but useful)
        const updatedCustomer = await Customer.findOne({
            where: { loan_account_no }
        });

        // ✅ Success response
        res.json({
            success: true,
            message: "Data updated successfully",
            data: updatedCustomer
        });

    } catch (error) {
        console.error("Update Error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};



module.exports = {
    uploadLoansExcel,
    getAllCustomers,
    getCustomersByUser,
    updateMobile
};