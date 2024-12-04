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

// Route pour vérifier si on est connecté sinon on demande de se connecter
router.get('', async (req, res) => {
    if (req.session.userId) {
        // Si l'utilisateur est déjà connecté, récupérer les informations de l'utilisateur
        try {
            const user = await prisma.utilisateur.findUnique({ where: { id: req.session.userId } });
            if (!user) {
                return res.redirect('/connexion');
            }

            // Rediriger l'utilisateur selon son rôle
            let redirectUrl;
            switch (user.roles) {
                case 'user':
                    redirectUrl = "/user-dashboard";
                    break;
                case 'transporteur':
                    redirectUrl = "/transporteur-dashboard";
                    break;
                case 'admin':
                    redirectUrl = "/admin-dashboard";
                    break;
                default:
                    return res.status(400).json({ error: "Rôle inconnu." });
            }

            return res.redirect(redirectUrl);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    // Si aucune session, afficher la page de connexion
    res.status(200).sendFile(path.join(__dirname, './../views/connexion/connexion.html'));
});

// Route pour déconnecter l'utilisateur
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la destruction de la session:', err);
            return res.status(500).json({ error: 'Erreur lors de la déconnexion.' });
        }
        res.clearCookie('connect.sid'); // Supprime le cookie de session
        res.redirect('/'); // Redirige vers la page d'accueil
    });
});

module.exports = router;
