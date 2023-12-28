const SERVER_URL = 'http://localhost:3001/api/';


/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

          // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
          response.json()
            .then(json => resolve(json))
            .catch(err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj =>
              reject(obj)
            ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err =>
        reject({ error: "Cannot communicate" })
      ) // connection error
  });
}

const getAirplaneByType = async (type) => {
  return getJson(fetch(SERVER_URL + 'planes/' + type.toString() ))
    .then((airplane) => {
      const clientAirPlane = {
        type: airplane.type,
        seats: airplane.seats// [{"seat":"1A" , "status":"A"}, {} ...]
      }
      return clientAirPlane;
    })
}

const getReservationsById = async (id) => {
  return getJson(fetch(SERVER_URL + 'users/'+ id.toString()+'/reservations' , {method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'}))
    .then((reservations) => reservations.map(r => r.seats)
    )
}

const createReservation = async (type, seats, id) => {

  const response = await fetch(SERVER_URL + "planes/" + type.toString() + "/user/" + id.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ seats , id})
  });

  if (!response.ok) {
    const errMessage = await response.json();
    throw errMessage;
  }
  else return null;
};

const deleteReservation = async (type, id) => {

  const response = await fetch(SERVER_URL + "user/" + id.toString() + "/planes/" + type.toString(), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errMessage = await response.json();
    throw errMessage;
  }
  else return null;
};

/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
 */
const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwared
    body: JSON.stringify(credentials),
  })
  )
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    // this parameter specifies that authentication cookie must be forwared
    credentials: 'include'
  })
  )
};


/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'  // this parameter specifies that authentication cookie must be forwared
  })
  )
}

const API = { logIn, getUserInfo, logOut, getAirplaneByType, createReservation, deleteReservation, getReservationsById };
export default API;