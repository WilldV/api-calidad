const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const dotenv = require('dotenv')

dotenv.config({ path: '.env' });

const routes = require('./routes')
const errorHandler = require('./middlewares/error')

const app = express()

app.set('PORT', 8000 || process.env.PORT)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(morgan('dev'))

app.use('/api', routes);
app.use(errorHandler)

module.exports = app