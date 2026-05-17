const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User") 

const registerUser = async (req, res) => {
  try {
    const {
      full_name = null,
      username = null,
      phone = null,
      email = null,
      password = null,
      address = null,
      status = null,
      role_id = null,
      
    } = req.body

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" })
    }

    // Check if the username already exists
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the new user
    const newUser = await User.create({
      full_name,
    
      username,
      phone,
      email,
      password: hashedPassword,
      address,
      status,
      role_id,
    
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Generate a JWT token
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET)
    await newUser.update({ token })

    res.status(201).json({ user: newUser, token })
  } catch (error) {
    // Improved error logging
    console.error("Error registering user:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body

    // Find the user by username
    const user = await User.findOne({ where: { username } })
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }
    
    if (user.status == "0") {
      return res.status(403).json({ error: "Account is not active" })
    }
    // Check the password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET)

    await user.update({ token })

    res.status(200).json({ token, message: "Login Successful" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll()
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get a single user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Update a user by ID
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const {
      full_name,
    
      username,
      phone,
      email,
      password,
      address,
      status,
      role_id,
     

    } = req.body

    const updatedFields = {
      full_name,
    
      username,
      phone,
      email,
      address,
      status,
      role_id,
   

      updatedAt: new Date(),
    }

    if (password) {
      updatedFields.password = await bcrypt.hash(password, 10)
    }

    const [updated] = await User.update(updatedFields, {
      where: { id: id },
    })

    if (!updated) {
      return res.status(404).json({ error: "User not found" })
    }

    const updatedUser = await User.findByPk(id)
    res.status(200).json(updatedUser)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Soft delete a user by ID (set status to 0)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findOne({ where: { id: id } })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Update user status to 0 instead of deleting
    user.status = 0  // Assuming 'status' is the field you want to update
    await user.save()

    res.status(200).json({ message: "User status updated to 0" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  
}
