const Department = require("../models/Department") 
const ActivityLog = require("../models/Activity")
const User = require("../models/User")

// Create a new department
const createdepartment = async (req, res) => {
  try {
    const { name = null, status = null } = req.body
    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })
    const newdepartment = await Department.create({
      name,
      status,
      createdAt: new Date(),
      createdby: user.userId,
    })


    await ActivityLog.create({
      activity_name: `User ${username.username} has Created the department ${newdepartment.name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res
      .status(201)
      .json({
        message: "department created successfully",
        data: newdepartment,
      })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get all departments
const getAlldepartments = async (req, res) => {
  try {
    const departments = await Department.findAll()
    res
      .status(200)
      .json({
        message: "departments retrieved successfully",
        data: departments,
      })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get a single department by ID
const getdepartmentById = async (req, res) => {
  try {
    const { id } = req.params
    const department = await Department.findByPk(id)
    if (!department) {
      return res.status(404).json({ error: "department not found" })
    }

    res
      .status(200)
      .json({ message: "department retrieved successfully", data: department })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Update a department by ID
const updatedepartment = async (req, res) => {
  try {
    const { id } = req.params
    const { name , status } = req.body

    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })
    const updatedFields = {
      name,
      status,
      updatedAt: new Date(),
      updatedby:user.userId,
    }

    const [updated] = await Department.update(updatedFields, {
      where: { id: id },
    })

    if (!updated) {
      return res.status(404).json({ error: "department not found" })
    }

    const updateddepartment = await Department.findByPk(id)


    await ActivityLog.create({
      activity_name: `User ${username.username} has Update the department ${updateddepartment.name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res
      .status(200)
      .json({
        message: "department updated successfully",
        data: updateddepartment,
      })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Delete a department by ID
const deletedepartment = async (req, res) => {
  try {
    const { id } = req.params

    // Fetch the department before updating
    const department = await Department.findOne({ where: { id: id } })
    if (!department) {
      return res.status(404).json({ error: "Department not found" })
    }

    // Update the department's status to 0
    await Department.update({ status: 0 }, { where: { id: id } })

    // Log activity
    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })

    await ActivityLog.create({
      activity_name: `User ${username.username} has deactivated the department ${department.name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(200).json({ message: "Department status updated to inactive successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


module.exports = {
  createdepartment,
  getAlldepartments,
  getdepartmentById,
  updatedepartment,
  deletedepartment,
}
