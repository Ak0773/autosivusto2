const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const fs = require('fs')
const { port, host } = require('./config.json')
const autot = require('./autot.json')
//const { toUnicode } = require('punycode')
const ejs = require('ejs')
const app = express()
const dbconfig = require('./dbconfig.json')
//const { error } = require('console')
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'sivupohjat'))
app.use('/inc', express.static('includes'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const { haeKaikki, haku, lisays, pois } = require('./tietokantakerros')
const { log, error } = require('console')

// const auto = require('./autot.json')
// const { kaikkiautot, lisaaAuto, haeAuto, poistaAutoe }

//app.get('/autot', (req, res) => {

//const autojson = haeKaikki()
//})

/*res.render('autolista', {
  autot: autot,
  lukumaara: autot.length,*/
// Pass the name variable to the template


// ?hakutulos.ejs 
app.post('/haku', async (req, res) => {
  try {
    const merkki = req.body.merkki
    const hakuJson = await haku(merkki)
    res.render('hakutulos', {
      autot: hakuJson
    })
  }
  catch (err) {
    console.error(err)
    //res.render('error', { viesti: error.viesti })
    res.render(
      "eiloydy"
    )
  }
})
app.get("/poisAuto", function (req, res) {
  res.render('poisAuto.ejs', {}); {
  }
})
app.post('/poisto', async (req, res) => {
  try {
    const valittu = req.body.id
    const autot = await pois(valittu)
    res.render('autolista', {
      autot: autot
    })
  }
  catch (error) {
    console.error(error)
    res.send('error', { viesti: `autoa ei saatu pistettua` })
  }
})

//? lisaa.ejs
app.get("/lisaa", function (req, res) {
  res.render('lisaa.ejs', {}); {
  }
})

//?etu sivu
app.get("/", async (req, res) => {

  try {
    const autotJson = await haeKaikki()
    res.render('autolista', {
      autot: autotJson,
      //lukumaara: autot.length,
    })
  }
  catch (err) {
    throw err
  }
})

//?autolista.ejs 
app.get("/autolista", function (req, res) {
  res.render("autolista.ejs", {})
})

//* lisää json 
app.post('/lisatty', async (req, res) => {
  try {
    const merkki = req.body.merkki
    const malli = req.body.malli
    const vuosimalli = req.body.vuosimalli
    const omistaja = req.body.omistaja
    await lisays(merkki, malli, vuosimalli, omistaja)
    res.render('lisatty.ejs')
  } catch (error) {
    console.error(error)
    // res.render('error', { viesti: error.viesti })
    res.render(
      "eilisays"
    )
  }


})

// JSON API-listaus
app.get('/autot', (req, res) => {
  res.json(autot)
})

app.get('/autot/:id', (req, res) => {
  const vastaus = []
  const haettava = Number.parseInt(req.params.id)

  for (let auto of autot) {
    if (auto.id === haettava) {
      vastaus.push(auto)
    }
  }
  res.json(vastaus)
})

app.post('/autot/uusi', (req, res) => {
  // kerätään tiedot pyynnön body-osasta
  const merkki = req.body.merkki
  const malli = req.body.malli
  const vuosimalli = req.body.vuosimalli
  const omistaja = req.body.omistaja
  // jos kaikkia tietoja ei ole annettu, ilmoitetaan virheestä
  // (muuttuja saa arvon undefined, jos vastaavaa elementtiä
  // ei ollut pyynnössä)
  if (merkki == undefined ||
    malli == undefined ||
    vuosimalli == undefined ||
    omistaja == undefined
  ) {
    res.status(400).json({ 'viesti': 'Virhe: Kaikkia tietoja ei annettu.' })
  }
  else {
    // luodaan tiedoilla uusi olio
    const uusi = {
      id: uusiauto(),
      merkki: merkki,
      malli: malli,
      vuosimalli: vuosimalli,
      omistaja: omistaja,
    }
    // lisätään olio työntekijöiden taulukkoon
    autot.push(uusi)
    // lähetetään onnistumisviesti
    res.json(uusi)
  }
})

app.put('/autot/:id', (req, res) => {
  const id = Number.parseInt(req.params.id)
  // kerätään tiedot pyynnön body-osasta
  const merkki = req.body.merkki
  const malli = req.body.malli
  const vuosimalli = req.body.vuosimalli
  const omistaja = req.body.omistaja

  // jos kaikkia tietoja ei ole annettu, ilmoitetaan virheestä
  // (muuttuja saa arvon undefined, jos vastaavaa elementtiä
  // ei ollut pyynnössä)
  if (
    id == undefined ||
    merkki == undefined ||
    malli == undefined ||
    vuosimalli == undefined ||
    omistaja == undefined
  ) {
    res.status(400).json({ 'viesti': 'Virhe: Kaikkia tietoja ei annettu.' })
  }
  else {
    let onOlemassa = false
    let uusi = {}

    // Etsitään muokattava henkilö ja muokataan arvot
    for (let auto of autot) {
      if (auto.id == id) {
        auto.merkki = merkki
        auto.malli = malli
        auto.vuosimalli = vuosimalli
        auto.omistaja = omistaja
        onOlemassa = true

        uusi = {
          id: id,
          merkki: merkki,
          malli: malli,
          vuosimalli: vuosimalli,
          omistaja: omistaja,
        }
      }
    }

    // Tarkistetaan onnistuiko muokkaaminen
    if (!onOlemassa) {
      res.status(400).json({ "viesti": "Virhe: Tuntematon auto." })
    }
    else {
      // lähetetään onnistumisviesti
      res.json(uusi)
    }
  }
})
app.get("/poisatty", function (req, res) {
  const valittu = req.query.id
  if (valittu) {
    pois(valittu)
  }
  res.send("Poisto onnistui")
})

app.delete('/autot/:id', (req, res) => {
  const poistettava = req.params.id
  let onOlemassa = false

  for (let i = 0; i < autot.length; i++) {
    if (autot[i].id == poistettava) {
      autot.splice(i, 1)
      onOlemassa = true

      // korjaus indeksinumeroon poistamisen jälkeen, jotta ei hypätä yhden henkilön yli
      i--
    }
  }

  if (onOlemassa) {
    res.json({ 'viesti': 'Auto poistettu.' })
  }
  else {
    res.status(400).json({ 'viesti': 'Virhe: Annettua ID-numeroa ei ole olemassa.' })
  }
})

// Käynnistetään express-palvelin
app.listen(port, host, () => { console.log('Autopalvelin kuuntelee') })
