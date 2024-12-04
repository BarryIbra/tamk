document.addEventListener("DOMContentLoaded", function () {
    // Configuration
    const CONFIG = {
        API_ENDPOINTS: {
            USER_INFO: '/utilisateurs/info',
            UPDATE_LOCATION: '/colis/localisation'
        },
        DELIVERY_STATUS: {
            PENDING: 'en_attente',
            IN_PROGRESS: 'en_cours',
            DELIVERED: 'livre'
        },
        DEFAULT_TEXT: 'Non défini'
    };

    // Sélecteurs DOM principaux
    const DOM = {
        menu: document.getElementById('menu'),
        nav: document.getElementById('nav'),
        table: document.getElementById('table'),
        searchResults: document.getElementById('search-results'),
        personInfo: document.getElementById('personne')
    };

    // Cache pour les informations des destinateurs
    const destinateurCache = {};

    // Initialisation des événements
    function initializeEventListeners() {
        DOM.menu?.addEventListener('click', () => {
            DOM.nav?.classList.toggle('visible');
        });

        document.body.addEventListener('click', handleGlobalClick);
        document.addEventListener('click', handleLocationButtonClick);
    }

    function handleGlobalClick(event) {
        const activeSelect = document.querySelector('.select-localisation');
        if (activeSelect &&
            !event.target.closest('.localisation') &&
            !event.target.closest('.select-localisation')) {
            activeSelect.remove();
        }
    }

    function handleLocationButtonClick(event) {
        if (!event.target.classList.contains('localisation')) return;

        event.preventDefault();
        createLocationSelect(event.target);
    }

    async function getDestinateur(destinateurId) {
        if (destinateurCache[destinateurId]) {
            return destinateurCache[destinateurId];
        }

        const response = await fetch(`/utilisateurs/id/${destinateurId}`);
        const data = await response.json();
        destinateurCache[destinateurId] = data;
        //console.log(data);
        
        return data;
    }
    

    async function populateTable(colisList,userInfos) {
        if (!Array.isArray(colisList)) return;

        const tbody = DOM.table?.querySelector('tbody') || DOM.table?.createTBody();
        if (!tbody) return;

        tbody.innerHTML = '';
        setupTableHeader();
        for (const colis of colisList) {
            const row = await createTableRowWithDestinateur(colis,userInfos);
            tbody.appendChild(row);
        }
    }

    // Ajoute les entêtes de la table theader
    function setupTableHeader() {
        const table = DOM.table;
        if (!table || table.querySelector('thead')) return; // Vérifie si l'entête existe déjà

        const thead = table.createTHead();
        const headerRow = thead.insertRow();

        const headers = [
            'Nom', 'Prénom', 'Numéro de colis', 'Téléphone',
            'Mode de transport', 'Ville de livraison', 'Date de livraison',
            'Localisation', 'Action'
        ];

        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
    }

    async function createTableRowWithDestinateur(colis,userInfos) {
        const row = document.createElement('tr');

        const destinateur = await getDestinateur(colis.destinateurId);
        //console.log(destinateur.user.lastname);
        const columns = [
            { key: 'lastname', source: destinateur.user },
            { key: 'firstname', source: destinateur.user },
            { key: 'numeroColis', source: colis },
            { key: 'phone', source: destinateur.user },
            { key: 'modeTransport', source: colis },
            { key: 'ville', source: colis },
            { key: 'dateLivraison', source: colis },
            { key: 'localisation', source: colis }
        ];

        columns.forEach(({ key, source }) => {
            const td = document.createElement('td');
            //console.log(source[key]);
            
            td.textContent = source[key] || CONFIG.DEFAULT_TEXT;
            row.appendChild(td);
        });

        const actionsTd = createActionButtons(colis,userInfos);
        row.appendChild(actionsTd);

        return row;
    }

    function createActionButtons(colis,userInfos) {
        const td = document.createElement('td');
        td.innerHTML = `
            <a href="#" class="btn btn-green"><i class="fa fa-download"></i></a>
            <a href="#" class="btn btn-red"><i class="fa fa-trash"></i></a>
            <a href="#" class="btn btn-orange localisation" id="local-${colis.id}">
                <i class="fa fa-edit"></i>
            </a>
        `;

        td.querySelector('.btn-green').addEventListener('click', (e) => {
            e.preventDefault();
            generatePDF(colis,userInfos);
        });

        return td;
    }

    function createLocationSelect(targetElement) {
        document.querySelectorAll('.select-localisation').forEach(select => select.remove());

        const select = document.createElement('select');
        select.className = 'select-localisation';

        const options = [
            { value: CONFIG.DELIVERY_STATUS.PENDING, text: 'Sélectionner' },
            { value: CONFIG.DELIVERY_STATUS.PENDING, text: 'En attente' },
            { value: CONFIG.DELIVERY_STATUS.IN_PROGRESS, text: 'En cours' },
            { value: CONFIG.DELIVERY_STATUS.DELIVERED, text: 'Livré' }
        ];

        select.innerHTML = options
            .map(opt => `<option value="${opt.value}">${opt.text}</option>`)
            .join('');

        targetElement.parentElement.appendChild(select);
        select.addEventListener('change', (e) => handleLocationChange(e, targetElement));
    }

    async function handleLocationChange(event, targetElement) {
        const colisId = targetElement.id.split('-')[1];
        const newLocation = event.target.value;
    
        try {
            // Envoie de la requête PUT pour mettre à jour la localisation
            const response = await fetch(`${CONFIG.API_ENDPOINTS.UPDATE_LOCATION}/${colisId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ localisation: newLocation })
            });
    
            // Vérification du statut HTTP de la réponse
            if (!response.ok) {
                // Si le statut n'est pas ok (par exemple, 404 ou 500), lance une erreur
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
    
            // Si la mise à jour est réussie, on récupère la réponse JSON
            const responseData = await response.json();
    
            // Si l'opération est réussie, actualise les données
            if (response.status === 200) {
                await refreshDeliveryData(colisId);
            } else {
                throw new Error(responseData.message || 'Échec de la mise à jour');
            }
    
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la localisation:', error);
            alert('Erreur lors de la mise à jour de la localisation');
        }
    }
    
    

    async function getUserInfo() {
        try {
            const response = await fetch(CONFIG.API_ENDPOINTS.USER_INFO);
            const data = await response.json();

            if (data.user) {
                updateUserDisplay(data.user);
                populateTable(data.user.transporteurColis,data.user);
            } else {
                DOM.searchResults.innerHTML =
                    '<div class="search-results">Vous n\'êtes pas connecté</div>';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des informations:', error);
            alert('Erreur lors du chargement des données');
        }
    }

    function updateUserDisplay(user) {
        const { firstname, lastname } = user;
        DOM.personInfo.innerHTML = `<i class="fa fa-user"></i> ${firstname} ${lastname}`;
    }

    async function generatePDF(colis, userInfos) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
    
            // Ajout des informations de l'expéditeur (userInfos)
            doc.setFontSize(12);
            doc.text("Vos informations", 10, 20);
            doc.text(`Prénom : ${userInfos.firstname}`, 10, 30);
            doc.text(`Nom : ${userInfos.lastname}`, 10, 40);
            doc.text(`Email : ${userInfos.email}`, 10, 50);
            doc.text(`Téléphone : ${userInfos.phone}`, 10, 60);
    
            // Séparation
            doc.text("-", 10, 70);
    
            // Informations sur le colis
            const colisDetails = [
                { text: "Détails du colis", size: 14, y: 80 },
                { text: `Numéro : ${colis.numeroColis}`, y: 90 },
                { text: `Mode de transport : ${colis.modeTransport}`, y: 100 },
                { text: `Ville : ${colis.ville}`, y: 110 },
                { text: `Date de livraison : ${colis.dateLivraison || CONFIG.DEFAULT_TEXT}`, y: 120 },
                { text: `Localisation : ${colis.localisation || CONFIG.DEFAULT_TEXT}`, y: 130 }
            ];
    
            colisDetails.forEach(item => {
                doc.setFontSize(item.size || 12);
                doc.text(item.text, 10, item.y);
            });
    
            // Récupération des informations du destinataire
            const destinataire = await getDestinateur(colis.destinateurId);
    
            // Vérification si les informations du destinataire existent
            if (destinataire && destinataire.user) {
                doc.text("-", 10, 140);
                doc.text("Informations du destinataire", 10, 150);
                doc.text(`Prénom : ${destinataire.user.firstname}`, 10, 160);
                doc.text(`Nom : ${destinataire.user.lastname}`, 10, 170);
                doc.text(`Email : ${destinataire.user.email}`, 10, 180);
                doc.text(`Téléphone : ${destinataire.user.phone}`, 10, 190);
            } else {
                doc.text("Informations du destinataire indisponibles", 10, 140);
            }

            //On ajoute les informaton de l'expéditeur
            doc.text("-", 10, 210);
             
            //On extrait les informations de l'expéditeur
            const expéditeur = await getDestinateur(colis.expediteurId);

            if (expéditeur && expéditeur.user) {
                doc.text("Informations de l'expéditeur", 10, 220);
                doc.text(`Prénom : ${expéditeur.user.firstname}`, 10, 230);
                doc.text(`Nom : ${expéditeur.user.lastname}`, 10, 240);
                doc.text(`Email : ${expéditeur.user.email}`, 10, 250);
                doc.text(`Téléphone : ${expéditeur.user.phone}`, 10, 260);
            } else {
                doc.text("Informations de l'expéditeur indisponibles", 10, 220);
            }
    
            // Enregistrement du PDF
            doc.save(`colis_${colis.numeroColis}.pdf`);
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            alert('Erreur lors de la génération du PDF');
        }
    }
    
    async function refreshDeliveryData() {
        try {
            await getUserInfo();
        } catch (error) {
            console.error('Erreur lors du rafraîchissement des données:', error);
        }
    }
    
    function init() {
        initializeEventListeners();
        getUserInfo().catch(error => {
            console.error('Erreur lors de l\'initialisation:', error);
        });
    }
    
    init();
    
});
