var express = require('express');
var router = express.Router();
var path = require('path'); 
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
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

// Middleware pour vérifier le rôle de l'utilisateur
async function ensureTransporteur(req, res, next) {
    if (!req.session.userId) {
        // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
        return res.redirect('/connexion');
    }

    try {
        // Récupérer l'utilisateur depuis la base de données avec Prisma
        const user = await prisma.utilisateur.findUnique({
            where: { id: req.session.userId },
            select: { roles: true } 
        });

        // Vérifier si l'utilisateur a été trouvé
        if (!user) {
            console.error('Utilisateur introuvable avec l\'ID:', req.session.userId);
            return res.redirect('/connexion'); // Rediriger si l'utilisateur n'existe pas
        }

        // Vérification du rôle de l'utilisateur
        if (user.roles === 'transporteur') {
            // Si l'utilisateur est un transporteur, continuer
            return next();
        } else if (user.roles === 'admin') {
            // Si l'utilisateur est un administrateur, rediriger vers le tableau de bord admin
            return res.redirect('/admin-dashboard');
        } else {
            // Sinon, rediriger vers le tableau de bord utilisateur
            return res.redirect('/user-dashboard');
        }
    } catch (error) {
        // Gestion des erreurs lors de la vérification
        console.error('Erreur lors de la vérification du rôle:', error.message);
        return res.status(500).send('Erreur interne du serveur. Veuillez réessayer plus tard.');
    }
}


// Route pour la page de tableau de bord du transporteur
router.get('', ensureTransporteur, (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '/../views/dashboard/transporteurDashboard.html'));
});

module.exports = router;
