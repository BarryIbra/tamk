var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const{jsPDF} = require("jspdf");
const doc = new jsPDF();

async function test() {
  const pays = await prisma.pays.findMany({
    include: {
      villes: true,
      utilisateurs: true,
      colis: true,
    }
  });
  console.log(JSON.stringify(pays, null, 2));
}

//test();

// Définition des routes
var accueilRouter = require('./routes/accueil');
var utilisateurRouter = require('./routes/utilisateur');
var connexionRouter = require('./routes/connexion');
var deconnexionRouter = require('./routes/deconnexion');
var colisRouter = require('./routes/colis');
var modeLivraisonRouter = require('./routes/modeLivraison');
var transportRouter = require('./routes/transport');
var loginRouter = require('./routes/loginApi');
var paysRouter = require('./routes/pays');
var inscriptionRouter = require('./routes/inscriptionApi');
var villeRouter = require('./routes/ville');
var transporteurRouter = require('./routes/transporteur');
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');






var app = express();

// Middleware
app.use(logger('dev')); // Journalisation des requêtes HTTP
app.use(express.json()); // Analyse des corps de requêtes JSON
app.use(express.urlencoded({ extended: false })); // Analyse des données URL-encodées
app.use(cookieParser()); // Analyse des cookies
app.use(express.static(path.join(__dirname, 'public'))); // Dossier public pour les fichiers statiques

// Routes
app.use('/', accueilRouter);
app.use('/utilisateurs', utilisateurRouter);
app.use('/connexion', connexionRouter);
app.use('/deconnexion', deconnexionRouter);
app.use('/colis', colisRouter);
app.use('/modeLivraison', modeLivraisonRouter);
app.use('/transport', transportRouter);
app.use('/loginApi', loginRouter);
app.use('/pays', paysRouter);
app.use('/inscription', inscriptionRouter);
app.use('/ville', villeRouter);
app.use('/transporteur-dashboard', transporteurRouter);
app.use('/user-dashboard', userRouter);
app.use('/admin-dashboard', adminRouter);



// Route pour le favicon.ico afin d'éviter l'erreur 404
app.get('/favicon.ico', (req, res) => res.status(204));

// Gestion des erreurs 404
app.use(function (req, res, next) {
  console.log(req)
    res.status(404).send('Page non trouvée');
});

// Exportation de l'application pour l'utiliser dans `bin/www`
module.exports = app;
