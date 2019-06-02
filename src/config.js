const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')

const routes = require('./routes')
const errorHandler = require('./middlewares/error')

const app = express()

app.set('PORT', process.env.PORT || 8000)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(morgan('dev'))

app.use('/api', routes);
app.use(cors());
app.use(errorHandler)

module.exports = app