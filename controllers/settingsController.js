const RoleSetting = require("../models/Settings") 
const User = require("../models/User") 
const ActivityLog = require("../models/Activity") 

const createSetting = async (req, res) => {
  try {
    const {
      role_id = null,
      setting_name = null,
      enabled = 1,
    } = req.body

    const { user } = req

    // Fetch the username of the user creating the setting
    const username = await User.findOne({ where: { id: user.userId } })

    // Create the new setting
    const newSetting = await RoleSetting.create({
      role_id,
      setting_name,
      enabled,
      createdAt: new Date(),
      createdby: user.userId,
      updatedAt: new Date(),
      updatedby: user.userId,
    })

    // Log the activity
    await ActivityLog.create({
      activity_name: `User ${username.username} created a new setting: ${newSetting.setting_name}`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      message: "Setting created successfully",
      data: newSetting,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Fetch user settings based on role
const getUserSettings = async (req, res) => {
  try {
    const { userId } = req.user // Assume user ID is extracted from the token

    // Fetch the user's role
    const user = await User.findOne({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    const roleId = user.role_id

    // Fetch the settings for the user's role
    const settings = await RoleSetting.findAll({ where: { role_id: roleId } })

    const roleSettings = settings.reduce((acc, setting) => {
      acc[setting.setting_name] = setting.enabled
      return acc
    }, {})


    res.status(200).json(roleSettings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateSetting = async (req, res) => {
  try {
    const { id } = req.params  // Extract the setting ID from the request params
    const { setting_name, enabled } = req.body  // Extract the `setting_name` and `enabled` fields from the request body
    const { user } = req  // Get the user making the request
    const username = await User.findOne({ where: { id: user.userId } })  // Get the user's information

    // Prepare the fields to be updated
    const updatedFields = {
      setting_name,
      enabled,
      updatedAt: new Date(),
      updatedby: user.userId,
    }

    // Update the setting
    const [updated] = await RoleSetting.update(updatedFields, {
      where: { id: id },
    })

    // If the setting wasn't found, return an error
    if (!updated) {
      return res.status(404).json({ error: "Setting not found" })
    }

    // Fetch the updated setting to return it
    const updatedSetting = await RoleSetting.findByPk(id)

    // Log the activity
    await ActivityLog.create({
      activity_name: `User ${username.username} has updated the setting "${updatedSetting.setting_name}"`,
      created_by: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Return the response
    res.status(200).json({
      message: "Setting updated successfully",
      data: updatedSetting,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getUserSettings,
  updateSetting,
  createSetting
}
