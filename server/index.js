/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');                                  // logging middleware
const cors = require('cors');

const { check, validationResult, } = require('express-validator'); // validation middleware

const planesDao = require('./dao-airplanes'); // module for accessing the films table in the DB
const userDao = require('./dao-users'); // module for accessing the user table in the DB

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev'));
app.use(express.json());

/**
 * The "delay" middleware introduces some delay in server responses. To change the delay change the value of "delayTime" (specified in milliseconds).
 * This middleware could be useful for debug purposes, to enabling it uncomment the following lines.
 */
/*
const delay = require('express-delay');
app.use(delay(200,2000));
*/

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));


/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if (!user)
    return callback(null, false, 'Incorrect username or password');

  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { // this user is id + username + name 
  callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + name 
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
  // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));

  return callback(null, user); // this will be available in req.user
});

/** Creating the session */
const session = require('express-session');

app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized' });
}


/*** Utility Functions ***/

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};


/*** Planes APIs ***/

// GET /api/planes/:type/seats
// This route retrieves the airplane information (including seats) for a specific plane type.
app.get('/api/planes/:type', async (req, res) => {
  const { type } = req.params;
  try {
    const airplane = await planesDao.getAirplaneByType(type);
    if (airplane.error)
      res.status(404).json({ error: "Plane not found" });
    else
      res.send((airplane))
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});

app.get('/api/users/:id/reservations', isLoggedIn, async (req,res) =>{
  const { id } = req.params;
  try {
    const reservations = await userDao.getUserReservations(id)
    if (reservations.error)
      res.status(404).json({ error: "User not found" });
    else
      res.send((reservations))
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
)

// PUT /api/planes/:type
app.put('/api/planes/:type/user/:id', isLoggedIn, async (req, res) => {
  const { type } = req.params;
  const { seats } = req.body;
  const user =req.user;
  try {
  
    const plane = await planesDao.getAirplaneByType(type);

    if (!plane) {
      res.status(404).json({ error: 'Airplane not found.' });
      return;
    }

    const pSeats = plane.seats;
    const alreadyReserved = pSeats.filter(s => seats.includes(s));

    const userId = user.id;
    const userReservations = user.reservations;

    // Check if the user already has a reservation for the given type
    const existingReservation = userReservations.find(r => r.type === type);

    if (existingReservation && existingReservation.seats.length > 0) {
      res.status(400).json({ error: 'User already has a reservation for this plane.' });
    } else if (alreadyReserved.length > 0) {
      res.status(400).json({ error: 'Some of the seats are already occupied.', alreadyReserved });
    } else {
      // Get the seat range based on the airplane type
      let seatRange;
      if (type === '1') {
        seatRange = generateSeatRange('A', 'D', 15);
      } else if (type === '2') {
        seatRange = generateSeatRange('A', 'E', 20);
      } else if (type === '3') {
        seatRange = generateSeatRange('A', 'F', 25);
      } else {
        res.status(400).json({ error: 'Invalid airplane type.' });
        return;
      }

      // Check if all the provided seats are within the valid range
      const invalidSeats = seats.filter(s => !seatRange.includes(s));
      if (invalidSeats.length > 0) {
        res.status(409).json({ error: 'Invalid seats', invalidSeats });
        return;
      }

      const seatsUpdate = pSeats.concat(seats);
      const result = await planesDao.updateOccupiedSeats(type, seatsUpdate);

      if (result.error) {
        res.status(404).json({ error: result.error });
      } else {
        // Find the reservation with the matching type
        const reservationIndex = userReservations.findIndex(r => r.type === type);

        if (reservationIndex !== -1) {
          // Update the seats field of the matching reservation
          userReservations[reservationIndex].seats = seats;
        } else {
          // Create a new reservation for the type
          userReservations.push({ type, seats });
        }

        // Update the user's reservations in the database
        await userDao.updateUserReservation(userId, userReservations);

        res.json({ success: 'Seat status updated successfully.' });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/user/:id/planes/:type
app.delete('/api/user/:id/planes/:type', isLoggedIn, async (req, res) => {
  const { type } = req.params;
  const user = req.user;
  try {

    const plane = await planesDao.getAirplaneByType(type);

    if (!plane) {
      res.status(404).json({ error: 'Airplane not found.' });
      return;
    }

    let userReservations = Array.isArray(user.reservations) ? user.reservations : Object.values(user.reservations);
     
    // Set the reservation with the matching type
    const reservationIndex = type-1;
    const seats = userReservations[reservationIndex].seats;

    if (seats.length === 0) {
      res.status(400).json({ error: 'The selected user does not have a reservation for this plane.' });
      return;
    }

    const pSeats = plane.seats;

    // Remove the reserved seats from the airplane's seat status
    const updatedSeats = pSeats.filter(s => !seats.includes(s));
    const result = await planesDao.updateOccupiedSeats(type, updatedSeats);

    if (result.error) {
      res.status(500).json({ error: 'Failed to update seat status.' });
      return;
    }

    // Remove the reservation from the user's reservations
    userReservations[reservationIndex].seats = []

    // Update the user's reservations in the database
    const updateResult = await userDao.updateUserReservation(user.id, userReservations);

    if (updateResult.error) {
      res.status(500).json({ error: 'Failed to update user reservations.' });
    } else {
      res.json({ success: 'Reservation deleted successfully.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper function to generate the seat range
function generateSeatRange(startLetter, endLetter, totalRows) {
  const range = [];
  const startCharCode = startLetter.charCodeAt(0);
  const endCharCode = endLetter.charCodeAt(0);

  for (let row = 1; row <= totalRows; row++){
    for (let charCode = startCharCode; charCode <= endCharCode; charCode++){
      const seat = row + String.fromCharCode(charCode) ;
      range.push(seat);
    }
  }
  return range;
}

/*** Users APIs ***/

// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json({ error: info });
    }
    // success, perform the login and extablish a login session
    req.login(user, (err) => {
      if (err)
        return next(err);

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser() in LocalStratecy Verify Fn
      return res.json(req.user);
    });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', isLoggedIn, (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Not authenticated' });
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', isLoggedIn, (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

// Activating the server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));
