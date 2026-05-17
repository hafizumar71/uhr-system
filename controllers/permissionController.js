const Permission = require("../models/Permission") 
const ActivityLog = require("../models/Activity")
const User = require("../models/User")

// Create a new permission
const createPermission = async (req, res) => {
  try {
    const {
      permission_name = null,
      description = null,
      status = null,
    } = req.body
    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })
    const newPermission = await Permission.create({
      permission_name,
      description,
      status,
      createdAt: new Date(),
      createdby:user.userId,
      updatedAt: new Date(),
      updatedby: user.userId
    })

    
    await ActivityLog.create({
      activity_name: `User ${username.username} created the new permission ${newPermission.permission_name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      message: "Permission created successfully",
      data: newPermission,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get all permissions
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll()
    res.status(200).json({
      message: "Permissions retrieved successfully",
      data: permissions,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get a single permission by ID
const getPermissionById = async (req, res) => {
  try {
    const { id } = req.params
    const permission = await Permission.findByPk(id)
    if (!permission) {
      return res.status(404).json({ error: "Permission not found" })
    }

    res
      .status(200)
      .json({ message: "Permission retrieved successfully", data: permission })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Update a permission by ID
const updatePermission = async (req, res) => {
  try {
    const { id } = req.params
    const {
      permission_name ,
      description ,
      status ,
    } = req.body
    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })
    const updatedFields = {
      permission_name,
      description,
      status,
      updatedAt: new Date(),
      updatedby:user.userId
    }

    const [updated] = await Permission.update(updatedFields, {
      where: { id: id },
    })

    if (!updated) {
      return res.status(404).json({ error: "Permission not found" })
    }

    const updatedPermission = await Permission.findByPk(id)

    // Activity log
    
    await ActivityLog.create({
      activity_name: `User ${username.username} has updated the permission  ${updatedPermission.permission_name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(200).json({
      message: "Permission updated successfully",
      data: updatedPermission,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Delete a permission by ID
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await Permission.destroy({
      where: { id: id },
    })
    if (!deleted) {
      return res.status(404).json({ error: "Permission not found" })
    }
    const permission = await Permission.findOne({ where: { id: id } })

    // Log activity
    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })
    await ActivityLog.create({
      activity_name: `User ${username.username} has deleted the permission ${permission.permission_name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(204).json({ message: "Permission deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  createPermission,
  getAllPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
}
