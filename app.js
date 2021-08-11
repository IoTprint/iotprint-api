require('dotenv').config()
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const crypto = require('crypto')
const helmet = require('helmet')

const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/product')
const jobRoutes = require('./routes/job')
const desktopRoutes = require('./routes/desktop')

const MONGODB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@node-cluster.znfsd.mongodb.net/${process.env.DEFAULT_DATABASE}?retryWrites=true&w=majority`

const app = express()

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.split('/')[0] === 'image') {
      cb(null, 'images')
    } else {
      cb(null, 'uploads')
    }
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${crypto.randomBytes(8).toString('hex')}.${
        file.originalname.split('.')[1]
      }`
    )
  },
})

const fileFilter = (req, file, cb) => {
  console.log(file.mimetype)
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    // file.mimetype === 'model/stl' ||
    file.mimetype === 'application/octet-stream'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

app.use(bodyParser.json())
app.use(
  multer({ storage: fileStorage, fileFilter }).fields([
    { name: 'image', maxCount: 1 },
    { name: 'gcode', maxCount: 1 },
  ])
)
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE '
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

app.use(helmet())

app.use('/api/auth', authRoutes)
app.use('/api', productRoutes)
app.use('/api', jobRoutes)
app.use('/api/download', desktopRoutes)

app.use((error, req, res, next) => {
  console.log(error)
  const status = error.statusCode
  const message = error.message
  const data = error.data
  res.status(status).json({
    message,
    data,
  })
})

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(result => {
    app.listen(process.env.PORT || 5000)
    console.log(`[+] Connected to Database`)
    console.log(`Listening on port ${process.env.PORT || 5000}`)
  })
  .catch(err => {
    console.log(err)
  })
