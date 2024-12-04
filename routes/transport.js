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


// Route pour extraire toutes les transport
router.get('', async (req, res) => {
    try {
        const transport = await prisma.transport.findMany({
            select: {
                id: true,
                prix: true,
                modeLivraison: true,
                chemin: true,
                villeDepart: true,
                villeArrive: true,
            }
        });

        if (transport.length === 0) {
            return res.status(404).json({ error: 'Aucun transport trouvée.' });
        }

        res.status(200).json({ transport });
    } catch (error) {
        console.error('Erreur lors de la récupération des transport:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des transport.' });
    }
});

// Route pour ajouter un nouvel transport
router.post('/ajouter', async (req, res) => {
    const { prix,modeLivraison,chemin,villeDepart,villeArrive } = req.body;

    if (!prix) {
        return res.status(400).json({ error: 'Le champ "prix" est requis.' });
    }

    try {
        const transport = await prisma.transport.create({
            data: {
                prix,
                modeLivraison,
                chemin,
                villeDepart,
                villeArrive
             }
        });

        res.status(201).json({ message: 'transport créée avec succès', transport });
    } catch (error) {
        console.error('Erreur lors de la création de la transport:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la transport.' });
    }
});

// Route pour modifier un transport existant
router.put('/modifier/:id', async (req, res) => {
    const transportId = parseInt(req.params.id, 10);
    const { prix,modeLivraison,chemin,villeDepart,villeArrive  } = req.body;

    if (!prix) {
        return res.status(400).json({ error: 'Le champ "prix" est requis.' });
    }

    try {
        const transport = await prisma.transport.findUnique({
            where: { id: transportId },
            select: { 
                id:true,
                prix: true,
                modeLivraison: true,
                chemin: true,
                villeDepart: true,
                villeArrive: true,
                chemin
            }
        });

        if (!transport) {
            return res.status(404).json({ error: 'transport non trouvée.' });
        }

        const updatedtransport = await prisma.transport.update({
            where: { id: transportId },
            data: { 
                prix,
                modeLivraison,
                villeDepart,
                villeArrive ,
                chemin
            }
        });

        res.status(200).json({ message: 'transport mise à jour avec succès', transport: updatedtransport });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la transport:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la transport.' });
    }
});

// Route pour supprimer une transport
router.delete('/supprimer/:id', async (req, res) => {
    const transportId = parseInt(req.params.id, 10);

    try {
        const transport = await prisma.transport.findUnique({
            where: { id: transportId },
        });

        if (!transport) {
            return res.status(404).json({ error: 'transport non trouvée.' });
        }

        await prisma.transport.delete({
            where: { id: transportId }
        });

        res.status(200).json({ message: 'transport supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la transport:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la transport.' });
    }
});




module.exports = router;
