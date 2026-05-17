const ActivityLog = require("../models/Activity") 
const User = require("../models/User") 

// Get all activities
const getAllActivities = async (req, res) => {
  try {
    const activities = await ActivityLog.findAll({
      order: [['createdAt', 'DESC']],
    })

    res.status(200).json({
      message: "Activities retrieved successfully",
      data: activities,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get logged-in user's activities
const getUserActivities = async (req, res) => {
  try {
    const { user } = req
    const userId = user.userId

    const userActivities = await ActivityLog.findAll({
      where: { created_by: userId },
      order: [['createdAt', 'DESC']],
    })

    res.status(200).json({
      message: "User activities retrieved successfully",
      data: userActivities,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}



module.exports = {
  getAllActivities,
  getUserActivities
}
