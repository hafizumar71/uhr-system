require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const cron = require('node-cron')
const { sequelize } = require("./models")

// Routes
const userRoutes = require('./routes/userRoutes')
const roleRoutes = require('./routes/roleRoutes')
const permissionRoutes = require('./routes/permissionRoutes')
const designationRoutes = require('./routes/designationRoutes')
const departmentRoutes = require('./routes/departmentRoutes')
const branchRoutes = require('./routes/branchRoutes')
const customerRoutes = require('./routes/customerRoutes')
const settingRoutes = require('./routes/settingsRoutes')
const remarksRoutes = require('./routes/customerremarksRoutes')


// NACTA function


const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({ storage })
module.exports = upload

// Routes
app.use('/api', userRoutes)
app.use('/api', roleRoutes)
app.use('/api', permissionRoutes)
app.use('/api', designationRoutes)
app.use('/api', departmentRoutes)
app.use('/api', branchRoutes)
app.use('/api', customerRoutes)
app.use('/api', remarksRoutes)
app.use('/api', settingRoutes)


app.get('/api/config', (req, res) => {
  res.json({ baseUrl: process.env.BASE_URL })
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'))
})
app.get('/edit-risk-form.html/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/edit-risk-form.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
})

// ⏰ Schedule the NACTA download job for 9:48 AM
cron.schedule('26 9 * * *', () => {
  console.log('⏰ Running scheduled NACTA download at 9:00 AM')
  runDownloadAndCheck()
})
