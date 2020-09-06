const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid = require('shortid');

const cors = require('cors')

//const mongoose = require('mongoose')
//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


//local database
const users = [];
const exercises = [];

const getUsernameById = (id) => users.find(user => user._id === id).username;

const getExercisesForUserById = (id) => exercises.filter(exe => exe._id === id);


app.post('/api/exercise/new-user', (req, res) => {
  let username = req.body.username;
  let newUser = {
    username: username,
    _id: shortid.generate()
  }
  users.push(newUser);
  return res.json(newUser);
});

app.get('/api/exercise/users', (req, res) => {
  return res.json(users);
});

app.post('/api/exercise/add', (req, res) => {
  const userId = req.body.userId;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;

  const dateObj = date === '' ? new Date() : new Date(date);

  const newExercise = {
    _id: userId,
    username: getUsernameById(userId),
    date: dateObj.toDateString(),
    duration: +duration,
    description: description
  }

  exercises.push(newExercise);
  return res.json(newExercise);
});

app.get('/api/exercise/log', (req, res) => {
  const userId = req.query.userId;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;

  const userExercises = getExercisesForUserById(userId);
  let log = [];
  userExercises.forEach(exercise => {
    let logObj = {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date
    }
    log.push(logObj);
  });

  if (from) {
    const fromDate = new Date(from);
    log = log.filter(exe => new Date(exe.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter(exe => new Date(exe.date) <= toDate);
  }

  if (limit) {
    log = log.slice(0, limit);
  }

  return res.json({
    _id: userId,
    username: getUsernameById(userId),
    count: log.length,
    log: log
  })
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
