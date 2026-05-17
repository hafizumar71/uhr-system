const Role = require("../models/Role") 
const ActivityLog = require("../models/Activity")
const User = require("../models/User")

// Create a new role
const createRole = async (req, res) => {
    try {
        const { name = null, permissions = null, status = null } = req.body
        const { user } = req
        const username = await User.findOne({ where: { id: user.userId } })

        const newRole = await Role.create({
            name,
            permissions,
            status,
            createdAt: new Date(),
            createdby: user.userId,
            updatedAt: new Date(),
            updatedby: user.userId,
        })

        await ActivityLog.create({
            activity_name: `User ${username.username} created the new role ${newRole.name}`,
            created_by: user.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        res
            .status(201)
            .json({ message: "Role created successfully", data: newRole })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Get all roles
const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll()
        res
            .status(200)
            .json({ message: "Roles retrieved successfully", data: roles })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Get a single role by ID
const getRoleById = async (req, res) => {
    try {
        const { id } = req.params
        const role = await Role.findByPk(id)
        if (!role) {
            return res.status(404).json({ error: "Role not found" })
        }

        res
            .status(200)
            .json({ message: "Role retrieved successfully", data: role })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Update a role by ID
const updateRole = async (req, res) => {
    try {
        const { id } = req.params
        const { name, permissions, status } = req.body
        let formattedPermissions

        if (Array.isArray(permissions)) {
            formattedPermissions = permissions.join(",")
        } else if (typeof permissions === "string") {
            formattedPermissions = permissions.replace(/\"/g, "")
        } else {
            formattedPermissions = ""
        }

        formattedPermissions = formattedPermissions.split(',').map(Number).join(',')
        const { user } = req
        const username = await User.findOne({ where: { id: user.userId } })
        const updatedFields = {
            name,
            permissions: formattedPermissions, // Save permissions in correct format
            status,
            updatedAt: new Date(),
            updatedby: user.userId,
        }

        const [updated] = await Role.update(updatedFields, {
            where: { id: id },
        })

        if (!updated) {
            return res.status(404).json({ error: "Role not found" })
        }

        const updatedRole = await Role.findByPk(id)

        // Activity log

        await ActivityLog.create({
            activity_name: `User ${username.username} has updated the role ${updatedRole.name}`,
            created_by: user.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        res.status(200).json({
            message: "Role updated successfully",
            data: updatedRole,
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


// Delete a role by ID
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params
        const role = await Role.findOne({ where: { id: id } })
        const deleted = await Role.destroy({
            where: { id: id },
        })
        if (!deleted) {
            return res.status(404).json({ error: "Role not found" })
        }

        // Log activity
        const { user } = req
        const username = await User.findOne({ where: { id: user.userId } })
        await ActivityLog.create({
            activity_name: `User ${username.username} has deleted the role ${role.name}`,
            created_by: user.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        res.status(204).json({ message: "Role deleted successfully" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole,
}
