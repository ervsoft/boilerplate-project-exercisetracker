const express = require('express')
const app = express()
const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect(process.env.MONGODB_URL,{useNewUrlParser: true, useUnifiedTopology: true});

const cors = require('cors')
require('dotenv').config()
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors())

mongoose.connection.on('connected', () => {
  console.log('connected');
  console.log(mongoose.connection.readyState); //logs 1
});


var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("connection success");
});

const userSchema = new Schema({
  username: String
});

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now },
  });
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// save new user with post 
app.post('/api/users', (req, res) => {
   const username = req.body.username;
    const newUser = new User({
    username: username,
    });
    //res.json({ username: req.body.username });
       newUser.save(function (err, newUser) {
        if (err) return console.error(err);
        res.json({
          username: newUser.username,
          _id: newUser.id,
         })
      });
  });

// Finished save new user with post 

// Show all user with get

app.get("/api/users", function (req, res) {
  User.find({}, function (err, users) {
    if (err) return console.error(err);
    res.json(users);
  });
});


// add new exercies 
app.post("/api/users/:_id/exercises", function (req, res) {
  const id = req.params._id;

  User.findById(id, "id username", function (err, user) {
    if (err) console.error(err);
  


    

    const username = user.username;
    const id = user.id;
    const description = req.body.description;
    const duration = Number(req.body.duration);
    const date = isNaN(Date.parse(req.body.date)) ?
      Date.now() :
      Date.parse(req.body.date);

    const newExercise = new Exercise({
      username: username,
      description : description,
      duration : duration,
      date : date,
    });

    
    newExercise.save(function (err, newExercise) {
      if (err) return console.error(err);

      res.json({
        username: newExercise.username,
        description : newExercise.description,
        duration : newExercise.duration,
        date : newExercise.date.toDateString(),
        _id: id
      })
    });
  });
});


//logs

app.get("/api/users/:_id/logs", function (req, res) {
  const id = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;

  User.findById(id, "username", function (err, user) {
    if (err) console.error(err);

    const username = user.username;
    let queryFilter = { username: username };
    let queryOptions = {};

    if (from || to) {
      queryFilter.date = {};
      if (from) queryFilter.date.$gte = Date.parse(from);
      if (to) queryFilter.date.$lte = Date.parse(to);
    }

    if (limit) queryOptions.limit = Number(limit);

    const exerciseQuery = Exercise.find(queryFilter, "description duration date", queryOptions);

    exerciseQuery.exec(function (err, exercises) {
      if (err) console.error(err);

      const exerciseCount = exercises.length;
      const exerciseList = exercises.map(function (exercise) {
        return {
          description : exercise.description,
          duration : exercise.duration,
          date : exercise.date.toDateString(),
        }
      })

      res.json({
        username: username,
        count: exerciseCount,
        _id: id,
        log: exerciseList
      });
    });
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
