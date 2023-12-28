'use strict';

/* Data Access Object (DAO) module for accessing users data */

const db = require('./db');
const crypto = require('crypto');

// This function returns user's information given its id.
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id=?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve(null);
      else {
        const user = { id: row.id, username: row.username, reservations: JSON.parse(row.reservations) };
        resolve(user);
      }
    });
  });
};

// This function is used at log-in time to verify username and password.
exports.getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username=?';
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      }
      else {
        const user = { id: row.id, username: row.username, reservations: JSON.parse(row.reservations) };

        // Check the hashes with an async call, this operation may be CPU-intensive (and we don't want to block the server)
        crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) { // WARN: it is 64 and not 32 (as in the week example) in the DB
          if (err) reject(err);
          if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword)) // WARN: it is hash and not password (as in the week example) in the DB
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};

exports.getUserReservations = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT reservations FROM users WHERE id=?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        const reservations = JSON.parse(row.reservations);
        resolve(reservations);
      }
    });
  });
};

exports.updateUserReservation = (id, reservations) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE users SET reservations=? WHERE id=?';
    const serializedReservations = JSON.stringify(reservations);

    db.run(sql, [serializedReservations, id], function (err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        resolve({ error: 'User not found.' });
      } else {
        resolve({ success: 'User reservations updated successfully.' });
      }
    });
  });
};
