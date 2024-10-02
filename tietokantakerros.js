const mysql = require('mysql2')
const dbconfig = require('./dbconfig.json')

function haeKaikki() {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(dbconfig)
    connection.connect()
    connection.query("SELECT * FROM auto",
      (err, rivit) => {
        if (err) {
          reject(err)
        }
        resolve(rivit)
      })
    connection.end()
  })
}

function haku(hakutermi) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!hakutermi) {
        return reject({ viesti: 'hakutermiä ei annetu' })
      }
      const autot = await haeKaikki()

      const autodata = autot.filter(auto =>
        auto.merkki.includes(hakutermi)) ||
        auto.malli.includes(hakutermi) ||
        auto.vuosimalli.includes(hakutermi) ||
        auto.omistaja.includes(hakutermi)
      if (autodata.length === 0) {
        reject({ viesti: "hakutermillä ei löytynyt" })
      } else {
        resolve(autodata)
      }
    } catch (error) {
      reject({ viesti: "Tapahtui virhe", error })
    }
  })
}


function lisays(merkki, malli, vuosimalli, omistaja) {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(dbconfig)
    connection.connect()
    connection.query(`INSERT INTO auto (merkki, malli, vuosimalli, omistaja) VALUES ("${merkki}", "${malli}", "${vuosimalli}", "${omistaja}")`,
      (err, rivit) => {
        if (err) {
          reject(err)
        }
        resolve(rivit)
      })
    connection.end()
  })
}
function pois(valittu) {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(dbconfig)

    connection.connect(err => {
      if (err) {
        return reject(err)
      }
    })
    const deleteQuery = 'DELETE FROM auto WHERE id = ?'
    connection.query(deleteQuery, [valittu], (err, result) => {
      if (err) {
        connection.end()
        return reject(err)
      }
      connection.query('SELECT * FROM auto', (err, rows) => {
        connection.end()

        if (err) {
          return reject(err)
        }

        resolve(rows)
      })
    })
  })
}



module.exports = { haeKaikki, haku, lisays, pois }