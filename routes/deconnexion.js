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

router.get('', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la déconnexion.' });
        }
        // Redirection vers la page d'accueil après la déconnexion
        res.redirect('/');
    });
});

module.exports = router;
