var express = require('express');
var router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
var path = require('path');
const session = require('express-session');
const{jsPDF} = require("jspdf");
const doc = new jsPDF();

// Configuration de la session
router.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
      secure: false,
      sameSite: 'Lax',
      maxAge: 10 * 60 * 1000, // Durée de la session (10 minutes)
      rolling: true // Prolonge la durée de vie du cookie à chaque requête
  }
}));

// Middleware pour vérifier l'inactivité et déconnecter l'utilisateur
router.use((req, res, next) => {
  if (req.session.userId) {
      const now = Date.now();
      if (req.session.lastActivity && now - req.session.lastActivity > 10 * 60 * 1000) {
          // Plus de 10 minutes d'inactivité
          req.session.destroy((err) => {
              if (err) console.error('Erreur lors de la destruction de la session:', err);
              return res.redirect('/'); // Redirige vers la page d'accueil
          });
      } else {
          req.session.lastActivity = now; // Met à jour le dernier moment d'activité
      }
  }
  next();
});

// Route pour extraire toutes les informations des pays, villes, colis et utilisateurs associés
router.get('', async (req, res) => {
  try {
    // Récupération de toutes les données des pays avec les relations incluses (villes, colis, utilisateurs)
    const pays = await prisma.pays.findMany({
      select: {
        id:true,
        nom:true,
        codeCountry:true,
        monnaie:true,
        villes: true, // Inclure les villes associées
        colis: true, // Inclure les colis associés
        utilisateurs: true, // Inclure les utilisateurs associés
      }
    });

    if (pays.length === 0) {
      return res.status(404).json({ error: 'Aucun pays trouvé.' });
    }

    // Répondre avec les pays et les informations associées
    res.status(200).json(pays);
  } catch (error) {
    console.error('Erreur lors de la récupération des pays:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des pays.' });
  }
});

// Route pour ajouter un nouvel pays
router.post('/ajouter', async (req, res) => {
  const { nom, codeCountry, colis, utilisateurs, villes } = req.body;

  if (!nom) {
    return res.status(400).json({ error: 'Le champ "nom" est requis.' });
  }

  try {
    // Création d'un nouveau pays avec ses relations
    const pays = await prisma.pays.create({
      data: {
        nom,
        codeCountry,
        colis,
        utilisateurs,
        villes
      }
    });

    res.status(201).json({ message: 'Pays créé avec succès', pays });
  } catch (error) {
    console.error('Erreur lors de la création du pays:', error);
    res.status(500).json({ error: 'Erreur lors de la création du pays.' });
  }
});
router.post('/ajouter2', async (req, res) => {
  const { nom, codeCountry, villes } = req.body;
  
  if (!nom) {
    return res.status(400).json({ error: 'Le champ "nom" est requis.' });
  }

  try {
    const pays = await prisma.pays.create({
      data: {
        nom,
        codeCountry,
        villes: {
          create: villes.map(ville => ({
            nom: ville.nom
          }))
        }
      },
      include: {
        villes: true // Pour retourner les villes créées dans la réponse
      }
    });

    res.status(201).json({ message: 'Pays créé avec succès', pays });
  } catch (error) {
    console.error('Erreur lors de la création du pays:', error);
    res.status(500).json({ error: 'Erreur lors de la création du pays.' });
  }
});

// Route pour modifier un pays existant
router.put('/modifier/:id', async (req, res) => {
  const paysId = parseInt(req.params.id, 10);
  const { nom, codeCountry, colis, utilisateurs, villes } = req.body;

  if (!nom) {
    return res.status(400).json({ error: 'Le champ "nom" est requis.' });
  }

  try {
    // Vérification si le pays existe
    const pays = await prisma.pays.findUnique({
      where: { id: paysId },
      include: {
        villes: true,
        colis: true,
        utilisateurs: true
      }
    });

    if (!pays) {
      return res.status(404).json({ error: 'Pays non trouvé.' });
    }

    // Mise à jour du pays avec les nouvelles données
    const updatedPays = await prisma.pays.update({
      where: { id: paysId },
      data: {
        nom,
        codeCountry,
        colis,
        utilisateurs,
        villes
      }
    });

    res.status(200).json({ message: 'Pays mis à jour avec succès', pays: updatedPays });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du pays:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du pays.' });
  }
});

// Route pour supprimer un pays
router.delete('/supprimer/:id', async (req, res) => {
  const paysId = parseInt(req.params.id, 10);

  try {
    // Vérification si le pays existe
    const pays = await prisma.pays.findUnique({
      where: { id: paysId },
    });

    if (!pays) {
      return res.status(404).json({ error: 'Pays non trouvé.' });
    }

    // Suppression du pays
    await prisma.pays.delete({
      where: { id: paysId }
    });

    res.status(200).json({ message: 'Pays supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du pays:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du pays.' });
  }
});

module.exports = router;
