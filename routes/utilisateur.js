const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const{jsPDF} = require("jspdf");
const doc = new jsPDF();

//fichier pdf



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

// Route pour vérifier si on est connecté, sinon redirection vers la connexion
router.get('', async (req, res) => {
    if (req.session.userId) {
        try {
            const user = await prisma.utilisateur.findUnique({ where: { id: req.session.userId } });
            if (!user) return res.redirect('/connexion');

            const roleRedirects = {
                user: "/utilisateurs/user-dashboard",
                transporteur: "/utilisateurs/transporteur-dashboard",
                admin: "/utilisateurs/admin-dashboard"
            };

            return res.redirect(roleRedirects[user.roles] || res.status(400).json({ error: "Rôle inconnu." }));
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    res.status(200).sendFile(path.join(__dirname, '/../views/connexion/connexion.html'));
});

// Route pour récupérer les informations de l'utilisateur connecté
router.get('/info', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Utilisateur non connecté' });
    //console.log("cisse ->");
    
    try {
        const user = await prisma.utilisateur.findUnique({
            where: { id: req.session.userId },
            select: {
                id: true, firstname: true, lastname: true, email: true, phone: true,
                profil: true, pays: true, destinateurColis: true, transporteurColis: true, transport: true
            }
        });
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

//Route pour récupérer un utilisateur par son id
router.get('/id/:id', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Utilisateur non connecté' });
    //console.log(req);
    

    const user = await prisma.utilisateur.findUnique({
        where: {
            id: parseInt(req.params.id)
        },
        
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.status(200).json({ user });
});

// Route pour récupérer tous les utilisateurs (administrateur uniquement)
router.get('/utilisateurs', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Utilisateur non connecté' });

    const user = await prisma.utilisateur.findUnique({ where: { id: req.session.userId } });
    if (user.roles !== 'admin') return res.status(403).json({ error: 'Accès interdit. Seul un administrateur peut accéder à cette ressource.' });

    try {
        const utilisateurs = await prisma.utilisateur.findMany({
            select: {
                id: true, firstname: true, lastname: true, email: true, phone: true,
                profil: true, pays: true, destinateurColis: true, transporteurColis: true, transport: true
            }
        });
        res.status(200).json({ users: utilisateurs });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs." });
    }
});


// Route pour récupérer tous les utilisateurs 
router.get('/utilisateurs-trans', async (req, res) => {
    try {
      const utilisateurs = await prisma.utilisateur.findMany({
        where: {
          roles: "transporteur", // Filtrer les transporteurs uniquement
        },
        include: {
          pays: {
            include: {
              villes: { // Inclure toutes les villes associées au pays
                select: {
                  id: true,
                  nom: true, // Inclure uniquement l'ID et le nom des villes
                },
              },
            },
          },
          transport: {
            select: {
              id: true,
              villeDepart: true,
              villeArrive: true,
              dateDepart: true,
              dateArrive: true,
              modeLivraisonId: true,
              modeLivraison: true,
              prix: true,
              villeDepart: true,
              villeArrive: true,
            },
            /* include: {
              paysDepart: { 
                include: { // Inclure les villes associées au pays de départ
                  villes: {
                    select: {
                      id: true,
                      nom: true,
                    },
                  },
                },
              },
              paysArrive: { 
                include: { // Inclure les villes associées au pays d'arrivée
                  villes: {
                    select: {
                      id: true,
                      nom: true,
                    },
                  },
                },
              },
            }, */
          },
        },
      });
  
      res.status(200).json({ users: utilisateurs });
    } catch (error) {
      console.error('Erreur lors de la récupération des transporteurs:', error.message);
      res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs." });
    }
  });
  

// Route pour créer un utilisateur
router.post('/creation', async (req, res) => {
    const { email, password, firstname, lastname, pays, phone, dateNaissance } = req.body;
    //console.log(req.body)
    try {
        const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "Cet utilisateur existe déjà avec cet email." });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.utilisateur.create({
            data: {
                email, roles: 'user', password: hashedPassword,
                firstname, lastname, phone,
                anneeNaissance: new Date(dateNaissance),
                is_verified: false,
                pays: { connect: { id: parseInt(pays) } }// pays est un Id 
            }
        });
        res.status(200).json({user,redirectUrl:'/'});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour supprimer un utilisateur
router.delete('/supprimer/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const existingUser = await prisma.utilisateur.findUnique({ where: { id: parseInt(id) }, select: { profil: true } });
        if (!existingUser) return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });

        if (existingUser.profil) {
            const filePath = path.join(__dirname, existingUser.profil);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await prisma.colis.deleteMany({ where: { id: parseInt(id) } });
        await prisma.transport.deleteMany({ where: { id: parseInt(id) } });
        await prisma.utilisateur.delete({ where: { id: parseInt(id) } });

        res.status(200).json({ success: true, message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l\'utilisateur.' });
    }
});

// Route pour modifier l'utilisateur
router.put('/modifier/:id', async (req, res) => {
    const { id } = req.params;
    const { use } = req.body;

    try {
        const existingUser = await prisma.utilisateur.findUnique({ where: { id: parseInt(id) } });
        if (!existingUser) return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });

        const updatedUser = await prisma.utilisateur.update({ where: { id: parseInt(id) }, data: { use } });
        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erreur lors de la modification de l\'utilisateur.' });
    }
});

// Routes pour les différentes pages de tableau de bord
router.get('/user-dashboard', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '/../views/utilisateur.html'));
});
router.get('/transporteur-dashboard', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '/../views/utilisateur.html'));
});
router.get('/admin-dashboard', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '/../views/utilisateur.html'));
});

module.exports = router;
