const Branch = require("../models/Branch")
const ActivityLog = require("../models/Activity")
const User = require("../models/User")
const Role = require("../models/Role");
const { Op } = require("sequelize");

// Create a new branch
const createBranch = async (req, res) => {
  try {
    const { branch_name = null, address = null, contact_info = null, status = null } = req.body

    const newBranch = await Branch.create({
      branch_name,
      address,
      contact_info,
      status,

      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })

    await ActivityLog.create({
      activity_name: `User ${username.username} has created the branch ${newBranch.branch_name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      message: "Branch created successfully",
      data: newBranch,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get all branches
const getAllBranches = async (req, res) => {
  try {
    const { user } = req;

    const currentUser = await User.findOne({
      where: { id: user.userId },
      include: [{ model: Role, as: "role", attributes: ["name"] }],
    });

    let branches;

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const roleName = currentUser.role?.name;
    if (roleName === "Admin") {
      branches = await Branch.findAll();
    } else if (roleName === "ARCO") {
      const rawBranchIds = currentUser.branch_ids;
      const branchIds = rawBranchIds
        ? rawBranchIds.replace(/[{}]/g, "").split(",").map(id => parseInt(id.trim()))
        : [];

      branches = await Branch.findAll({
        where: {
          id: { [Op.in]: branchIds }
        }
      });
    } else {
      branches = []; // Optional: handle other roles if needed
    }

    res.status(200).json({
      message: "Branches retrieved successfully",
      data: branches,
    });
  } catch (error) {
    console.error("Error in getAllBranches:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get a single branch by ID
const getBranchById = async (req, res) => {
  try {
    const { id } = req.params
    const branch = await Branch.findByPk(id)
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" })
    }


    res.status(200).json({
      message: "Branch retrieved successfully",
      data: branch,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Update a branch by ID
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params
    const { branch_name, address, contact_info, status } = req.body

    const updatedFields = {
      branch_name,
      address,
      contact_info,
      status,

      updatedAt: new Date(),
    }

    const [updated] = await Branch.update(updatedFields, {
      where: { id: id },
    })

    if (!updated) {
      return res.status(404).json({ error: "Branch not found" })
    }

    const updatedBranch = await Branch.findByPk(id)

    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })

    await ActivityLog.create({
      activity_name: `User ${username.username} has updated the branch ${updatedBranch.branch_name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(200).json({
      message: "Branch updated successfully",
      data: updatedBranch,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Delete a branch by ID
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params

    // Fetch the branch before deletion
    const branch = await Branch.findOne({ where: { id: id } })
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" })
    }

    // Delete the branch
    await Branch.destroy({ where: { id: id } })

    // Log activity
    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })

    await ActivityLog.create({
      activity_name: `User ${username.username} has deleted the branch ${branch.branch_name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(200).json({ message: "Branch deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
}
