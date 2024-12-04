var express = require('express');
var router = express.Router();
const {PrismaClient}=require("@prisma/client");
const prisma = new PrismaClient();
var path = require('path'); 
const Joi = require('joi');
const bcrypt = require('bcrypt');
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


const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

//1 Route pour la connexion

router.post('', async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    
    const { email, password } = req.body;
    
    try {
        const user = await prisma.utilisateur.findUnique({ where: { email:email } });
        if (!user) {
            return res.status(400).json({ error: "Cet utilisateur n'existe pas." });
        }
        
        // On vérifie le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
                return res.status(400).json({ error: "Mot de passe incorrect." });
        }

        //console.log(user);
        // Stocker l'ID de l'utilisateur dans la session
        req.session.userId = user.id;
        
        // On extrait le role, nom et prénom
        const { roles, firstname, lastname } = user;

        // Rediriger l'utilisateur selon son rôle
        if (roles === 'user') {
            res.status(200).json({
                redirectUrl: "/user-dashboard", 
                userInfo: {
                    firstname,
                    lastname,
                    email: user.email
                }
            });
        } else if (roles === 'transporteur') {
            res.status(200).json({
                redirectUrl: "/transporteur-dashboard", 
                userInfo: {
                    firstname,
                    lastname,
                    email: user.email
                }
            });
        } else if (roles === 'admin') {
            res.status(200).json({
                redirectUrl: "/admin-dashboard", 
                userInfo: {
                    firstname,
                    lastname,
                    email: user.email
                }
            });
        } else {
            res.status(400).json({ error: "Rôle inconnu." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
