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


// Route pour extraire toutes les modeLivraison
router.get('', async (req, res) => {
    try {
        const modeLivraison = await prisma.modeLivraison.findMany({
            select: {
                id: true,
                libelle: true,
                description: true,
                transporteurs: true,
            }
        });
        //console.log(modeLivraison);
        
        if (modeLivraison.length === 0) {
            return res.status(404).json({ error: 'Aucun modeLivraison trouvée.' });
        }

        res.status(200).json({ modeLivraison });
    } catch (error) {
        console.error('Erreur lors de la récupération des modeLivraison:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des modeLivraison.' });
    }
});

// Route pour ajouter un nouvel modeLivraison
router.post('/ajouter', async (req, res) => {
    const { libelle,description,transporteurs } = req.body;

    if (!libelle) {
        return res.status(400).json({ error: 'Le champ "modeLivraison" est requis.' });
    }

    try {
        const modeLivraison = await prisma.modeLivraison.create({
            data: {
                libelle,
                description,
                transporteurs,
             }
        });

        res.status(201).json({ message: 'modeLivraison créée avec succès', modeLivraison });
    } catch (error) {
        console.error('Erreur lors de la création de la modeLivraison:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la modeLivraison.' });
    }
});

// Route pour modifier un modeLivraison existant
router.put('/modifier/:id', async (req, res) => {
    const modeLivraisonId = parseInt(req.params.id, 10);
    const { libelle,description,ModeLivraisonColis } = req.body;

    if (!libelle) {
        return res.status(400).json({ error: 'Le champ "libelle" est requis.' });
    }

    try {
        const modeLivraison = await prisma.modeLivraison.findUnique({
            where: { id: modeLivraisonId },
            select: { 
                id:true,
                libelle: true,
                description: true,
                transporteurs: true
            }
        });

        if (!modeLivraison) {
            return res.status(404).json({ error: 'modeLivraison non trouvée.' });
        }

        const updatedmodeLivraison = await prisma.modeLivraison.update({
            where: { id: modeLivraisonId },
            data: { 
                libelle,
                 poids,
                 description,
                 transporteurs
            }
        });

        res.status(200).json({ message: 'modeLivraison mise à jour avec succès', modeLivraison: updatedmodeLivraison });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la modeLivraison:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la modeLivraison.' });
    }
});

// Route pour supprimer une modeLivraison
router.delete('/supprimer/:id', async (req, res) => {
    const modeLivraisonId = parseInt(req.params.id, 10);

    try {
        const modeLivraison = await prisma.modeLivraison.findUnique({
            where: { id: modeLivraisonId },
        });

        if (!modeLivraison) {
            return res.status(404).json({ error: 'modeLivraison non trouvée.' });
        }

        await prisma.modeLivraison.delete({
            where: { id: modeLivraisonId }
        });

        res.status(200).json({ message: 'modeLivraison supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la modeLivraison:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la modeLivraison.' });
    }
});




module.exports = router;
