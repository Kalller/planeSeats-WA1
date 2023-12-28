'use strict';

/* Data Access Object (DAO) module for accessing airplanes data */

const db = require('./db');

// This function returns the airplane information for a given type (id).
exports.getAirplaneByType = (type) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM airplanes WHERE type=?';
    db.get(sql, [type], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve(null);
      else {
        const airplane = {
          type: row.type,
          seats: JSON.parse(row.seats)
        };
        resolve(airplane);
      }
    });
  });
};

// This function updates the status of the seats in the airplane.
exports.updateOccupiedSeats = (type, seats) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE airplanes SET seats = ? WHERE type = ?';
    const updatedSeats = JSON.stringify(seats);
    
    db.run(sql, [updatedSeats, type], function (err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        resolve({ error: 'Airplane not found.' });
      } else {
        resolve({ success: 'Seat status updated successfully.' });
      }
    });
  });
};



// This function retrieves the total number of seats for a given airplane type.
exports.getTotalSeatsCount = (type) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT seats FROM airplanes WHERE id=?';
    db.get(sql, [type], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'Airplane not found.' });
      else {
        const seats = JSON.parse(row.seats);
        const totalSeatsCount = seats.length;
        resolve(totalSeatsCount);
      }
    });
  });
};

// This function retrieves the number of occupied seats for a given airplane type.
exports.getOccupiedSeatsCount = (type) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT seats FROM airplanes WHERE id=?';
    db.get(sql, [type], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'Airplane not found.' });
      else {
        const seats = JSON.parse(row.seats);
        const occupiedSeatsCount = seats.filter(seat => seat.status === 'O').length;
        resolve(occupiedSeatsCount);
      }
    });
  });
};

// This function retrieves the number of available seats for a given airplane type.
exports.getAvailableSeatsCount = (type) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT seats FROM airplanes WHERE id=?';
    db.get(sql, [type], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'Airplane not found.' });
      else {
        const seats = JSON.parse(row.seats);
        const availableSeatsCount = seats.filter(seat => seat.status === 'A').length;
        resolve(availableSeatsCount);
      }
    });
  });
};

