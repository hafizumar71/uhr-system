const Designation = require("../models/Designation") 
const ActivityLog = require("../models/Activity")
const User = require("../models/User")

// Create a new Designation
const createDesignation = async (req, res) => {
  try {
    const { name = null, status = null } = req.body
    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })
    const newDesignation = await Designation.create({
      name,
      status,
      createdAt: new Date(),
      createdby: user.userId,
    })

  

    await ActivityLog.create({
      activity_name: `User ${username.username} has Created the Designation ${newDesignation.name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res
      .status(201)
      .json({
        message: "Designation created successfully",
        data: newDesignation,
      })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get all Designations
const getAllDesignations = async (req, res) => {
  try {
    const Designations = await Designation.findAll()
    res
      .status(200)
      .json({
        message: "Designations retrieved successfully",
        data: Designations,
      })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get a single Designation by ID
const getDesignationById = async (req, res) => {
  try {
    const { id } = req.params
    const designation = await Designation.findByPk(id)
    if (!designation) {
      return res.status(404).json({ error: "Designation not found" })
    }

    res
      .status(200)
      .json({
        message: "Designation retrieved successfully",
        data: designation,
      })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Update a Designation by ID
const updateDesignation = async (req, res) => {
  try {
    const { id } = req.params
    const { name , status } = req.body
    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })
    const updatedFields = {
      name,
      status,
      updatedAt: new Date(),
      updatedby: user.userId,
    }

    const [updated] = await Designation.update(updatedFields, {
      where: { id: id },
    })

    if (!updated) {
      return res.status(404).json({ error: "Designation not found" })
    }

    const updatedDesignation = await Designation.findByPk(id)

    await ActivityLog.create({
      activity_name: `User ${username.username} has Update the Designation ${updatedDesignation.name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res
      .status(200)
      .json({
        message: "Designation updated successfully",
        data: updatedDesignation,
      })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Delete a Designation by ID
const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params

    // Fetch the Designation before updating
    const designation = await Designation.findOne({ where: { id: id } })
    if (!designation) {
      return res.status(404).json({ error: "Designation not found" })
    }

    // Update the Designation's status to 0
    await Designation.update({ status: 0 }, { where: { id: id } })

    // Log activity
    const { user } = req
    const username = await User.findOne({ where: { id: user.userId } })

    await ActivityLog.create({
      activity_name: `User ${username.username} has deactivated the Designation ${designation.name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(200).json({ message: "Designation status updated to inactive successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


module.exports = {
  createDesignation,
  getAllDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
}
