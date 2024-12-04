const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
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

// Middleware pour vérifier si l'utilisateur est connecté
function ensureAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.status(401).sendFile(path.join(__dirname, '/../views/connexion/connexion.html'));
}

// Route pour extraire tous les colis
router.get('', ensureAuthenticated, async (req, res) => {
    try {
        const colis = await prisma.colis.findMany({
            select: {
                id: true,
                numeroColis: true,
                poids: true,
                transporteur: true,
                localisation: true,
                destinateur: true
            }
        });

        if (colis.length === 0) {
            return res.status(404).json({ error: 'Aucun colis trouvé.' });
        }

        res.status(200).json({ colis });
    } catch (error) {
        console.error('Erreur lors de la récupération des colis:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des colis.' });
    }
});

// Route pour ajouter un nouvel utilisateur avec un colis
router.post('/ajouter-users', ensureAuthenticated, async (req, res) => {
    const { villeDepart, villeDetination, dateDepart, voie, poids, firstname, lastname, phone, emailDestinateur, idTrans } = req.body;

    //console.log("Données reçues :", req.body);

    try {
        // Vérification que les données requises sont présentes
        if (!villeDetination || !voie || !poids || !firstname || !lastname || !phone || !emailDestinateur || !idTrans) {
            return res.status(400).json({ error: "Tous les champs requis ne sont pas remplis." });
        }

        // Récupération des données liées au mode de livraison et au pays de destination
        const voieData = await prisma.modeLivraison.findUnique({where: { id: parseInt(voie) },select: { libelle: true }});

        if (!voieData) {
            return res.status(404).json({ error: "Mode de livraison introuvable." });
        }

        const paysDestinationData = await prisma.pays.findFirst({where: {villes: {some: {nom: villeDetination}}},select: {id: true}});
        const paysDepartData = await prisma.pays.findFirst({where: {villes: {some: {nom: villeDepart}}},select: {id: true}});

        if (!paysDestinationData) {
            return res.status(404).json({ error: `Aucun pays trouvé pour la ville ${villeDetination}.` });
        }

        // Génération d'un numéro unique pour le colis
        const numeroColis = await genererNumeroDeSuiviUnique();

        // Création du colis
        const colis = await prisma.colis.create({
            data: {
                numeroColis,
                poids: parseFloat(poids),
                villeDepart: villeDepart,
                ville: villeDetination,
                dateDepart: new Date(dateDepart),
                modeTransport: voieData.libelle,
                destinateur: {
                    create: { firstname, lastname, phone, emailDestinateur: emailDestinateur, pays: { connect: { id: paysDestinationData.id } } }},
                transporteur: { connect: { id: parseInt(idTrans)}},
                pays: { connect: { id: paysDepartData.id } },
                expediteur: { connect: { id: parseInt(req.session.userId) } }
            }
        });

        // Réponse en cas de succès
        res.status(201).json({ message: 'Colis créé avec succès', colis });
    } catch (error) {
        console.error('Erreur lors de la création du colis:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création du colis.' });
    }
});

// Route pour ajouter un colis (autre exemple)
router.post('/ajouter', ensureAuthenticated, async (req, res) => {
    const { poids, localisation, destinateurId, transporteurId } = req.body;

    if (!poids || !localisation || !destinateurId || !transporteurId) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    try {
        const numeroColis = await genererNumeroDeSuiviUnique();
        const colis = await prisma.colis.create({
            data: {
                numeroColis,
                poids: parseFloat(poids),
                localisation,
                destinateur: { connect: { id: parseInt(destinateurId) } },
                transporteur: { connect: { id: parseInt(transporteurId) } }
            }
        });

        res.status(201).json({ message: 'Colis créé avec succès', colis });
    } catch (error) {
        console.error('Erreur lors de la création du colis:', error);
        res.status(500).json({ error: 'Erreur lors de la création du colis.' });
    }
});

// Route pour modifier un colis existant
router.put('/modifier/:id', ensureAuthenticated, async (req, res) => {
    const colisId = parseInt(req.params.id, 10);
    const { numeroColis, poids, localisation, destinateurId, transporteurId } = req.body;

    if (!localisation || !destinateurId || !transporteurId) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    try {
        const colis = await prisma.colis.findUnique({ where: { id: colisId } });

        if (!colis) {
            return res.status(404).json({ error: 'Colis non trouvé.' });
        }

        const updatedColis = await prisma.colis.update({
            where: { id: colisId },
            data: {
                numeroColis,
                poids: parseFloat(poids),
                localisation,
                destinateur: { connect: { id: parseInt(destinateurId) } },
                transporteur: { connect: { id: parseInt(transporteurId) } }
            }
        });

        res.status(200).json({ message: 'Colis mis à jour avec succès', colis: updatedColis });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du colis:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du colis.' });
    }
});

//Route pour modifier la localisation d'un colis (en attente, livre, en cours)
router.put('/localisation/:id', ensureAuthenticated, async (req, res) => {
    const colisId = parseInt(req.params.id, 10);
    const localisation = req.body.localisation;
    try {
        const colis = await prisma.colis.findUnique({ where: { id: colisId } });    
        if (!colis) {
            return res.status(404).json({ error: 'Colis non trouvé.' });
        }
        const updatedColis = await prisma.colis.update({
            where: { id: colisId },
            data: { localisation: localisation },
        });    
        res.status(200).json({ message: 'Localisation mise à jour avec succès', colis: updatedColis });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la localisation du colis:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la localisation du colis.' });
    }
});


// Route pour supprimer un colis
router.delete('/supprimer/:id', ensureAuthenticated, async (req, res) => {
    const colisId = parseInt(req.params.id, 10);

    try {
        const colis = await prisma.colis.findUnique({ where: { id: colisId } });

        if (!colis) {
            return res.status(404).json({ error: 'Colis non trouvé.' });
        }

        await prisma.colis.delete({ where: { id: colisId } });

        res.status(200).json({ message: 'Colis supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du colis:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du colis.' });
    }
});

// Fonction auxiliaire pour générer un numéro de suivi unique
async function genererNumeroDeSuiviUnique() {
    let numeroDeSuivi;
    let colisExiste;

    do {
        const randomNumber = Math.floor(1000 + Math.random() * 9000);
        const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        numeroDeSuivi = `COLIS-${randomLetter}${randomNumber}`;
        colisExiste = await prisma.colis.findUnique({ where: { numeroColis: numeroDeSuivi } });
    } while (colisExiste);

    return numeroDeSuivi;
}

module.exports = router;
