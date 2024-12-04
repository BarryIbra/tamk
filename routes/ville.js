var express = require('express');
var router = express.Router();
const {PrismaClient}=require("@prisma/client");
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

// Route pour extraire toutes les ville
router.get('', async (req, res) => {
    try {
        const ville = await prisma.ville.findMany({
            select: {
                id: true,
                nom: true,
                pays:true
            }
        });

        if (ville.length === 0) {
            return res.status(404).json({ error: 'Aucun ville trouvée.' });
        }

        res.status(200).json({ ville });
    } catch (error) {
        console.error('Erreur lors de la récupération des ville:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des ville.' });
    }
});
router.get('/clients', async (req, res) => {
    try {
        const ville = await prisma.ville.findMany({
            select: {
                id: true,
                nom: true,
                pays:true
            }
        });

        if (ville.length === 0) {
            return res.status(404).json({ error: 'Aucun ville trouvée.' });
        }

        res.status(200).json({ ville });
    } catch (error) {
        console.error('Erreur lors de la récupération des ville:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des ville.' });
    }
});

// Route pour ajouter une nouvele ville
router.post('/ajouter', async (req, res) => {
    const { nom,pays } = req.body;

    if (!nom) {
        return res.status(400).json({ error: 'Le champ "nom" est requis.' });
    }

    try {
        const ville = await prisma.ville.create({
            data: {
                nom,
                pays
             }
        });

        res.status(201).json({ message: 'ville créée avec succès', ville });
    } catch (error) {
        console.error('Erreur lors de la création de la ville:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la ville.' });
    }
});

// Route pour modifier un ville existant
router.put('/modifier/:id', async (req, res) => {
    const villeId = parseInt(req.params.id, 10);
    const {  nom,pays } = req.body;

    if (!nom) {
        return res.status(400).json({ error: 'Le champ "prix" est requis.' });
    }

    try {
        const ville = await prisma.ville.findUnique({
            where: { id: villeId },
            select: { 
                id:true,
                nom: true,
                pays:true
            }
        });

        if (!ville) {
            return res.status(404).json({ error: 'ville non trouvée.' });
        }

        const updatedville = await prisma.ville.update({
            where: { id: villeId },
            data: { 
                nom,
                pays
            }
        });

        res.status(200).json({ message: 'ville mise à jour avec succès', ville: updatedville });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la ville:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la ville.' });
    }
});

// Route pour supprimer une ville
router.delete('/supprimer/:id', async (req, res) => {
    const villeId = parseInt(req.params.id, 10);

    try {
        const ville = await prisma.ville.findUnique({
            where: { id: villeId },
        });

        if (!ville) {
            return res.status(404).json({ error: 'ville non trouvée.' });
        }

        await prisma.ville.delete({
            where: { id: villeId }
        });

        res.status(200).json({ message: 'ville supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la ville:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la ville.' });
    }
});


// Route pour rechercher des villes en fonction de la saisie
router.get("/villes", async (req, res) => {
    const searchQuery = req.query.search.toLowerCase(); // Convertir la recherche en minuscule
  
    if (!searchQuery) {
      return res.json([]);
    }
  
    try {
      const villes = await prisma.ville.findMany({
        where: {
          nom: {
            startsWith: searchQuery, // Filtrer les noms de villes qui commencent par la recherche en minuscule
          },
        },
        select: {
          nom: true,
          pays: true,
        },
      });
  
      res.json({villes});
    } catch (error) {
      console.error("Erreur lors de la recherche des villes:", error);
      res.status(500).json({ error: "Erreur lors de la recherche des villes" });
    }
  });
  



module.exports = router;
