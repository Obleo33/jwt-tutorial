// =================================================================
// require all necessary packages & our .env config file ===========
// =================================================================
const jwt = require('jsonwebtoken')
const config = require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');



// =================================================================
// app setup & configuration =======================================
// =================================================================

app.locals.trains = [
  { id: 1, line: 'green', status: 'running' },
  { id: 2, line: 'blue', status: 'delayed' },
  { id: 3, line: 'red', status: 'down' },
  { id: 4, line: 'orange', status: 'maintenance' }
];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

if (!config.CLIENT_SECRET || !config.USERNAME || !config.PASSWORD) {
  throw 'Make sure you have a CLIENT_SECRET, USERNAME, and PASSWORD in your .env file'
}

app.set('secretKey', config.CLIENT_SECRET);


const checkAuth = (request, response, next) => {

  const token = request.body.token ||
                request.param('token') ||
                request.headers['authorization'];

  if (token) {
    jwt.verify(token, app.get('secretKey'), (error, decoded) => {
      if (error) {
        return response.status(403).send({
          success: false,
          message: 'Invalid authorization token.'
        })
      } else {
        request.decoded = decoded;
        next()
      }
    })
  } else {
    return response.status(403).send({
      success: false,
      message: 'You must be authorized to hit this endpoint'
    })
  }
}

// =================================================================
// API Endpoints ===================================================
// =================================================================

app.get('/api/v1/trains', (request, response) => {
  response.send(app.locals.trains);
})

app.post('/authenticate', (request, response) => {
    const user = request.body

      if (user.username !== config.USERNAME || user.password !== config.PASSWORD) {
      response.status(403).send({
        success: false,
        message: 'Invalid Credentials'
      })
    }

    else {
      let token = jwt.sign(user, app.get('secretKey'), {
        expiresIn: 172800
      })

      response.json({
        success: true,
        username: user.username,
        token: token
      })
    }
  })


  app.patch('/api/v1/trains/:id', checkAuth, (request, response) => {
    const { train } = request.body
    const { id } = request.params
    const index = app.locals.trains.findIndex((m) => m.id == id)

    if (index === -1) { return response.sendStatus(404); }

    const originalTrain = app.locals.trains[index]
    app.locals.trains[index] = Object.assign(originalTrain, train)

    return response.json(app.locals.trains)
  })


// =================================================================
// start the server ================================================
// =================================================================

app.listen(3001);
console.log('Listening on http://localhost:3001');
