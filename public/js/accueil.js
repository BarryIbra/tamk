document.addEventListener("DOMContentLoaded", function () {
    // Toggle pour le menu de navigation
    const menuBtn = document.getElementById("menu-btn");
    const navLinks = document.getElementById("nav-links");
    const menuBtnIcon = menuBtn.querySelector("i");
    let idTrans = -1;

    menuBtn.addEventListener("click", toggleMenu);
    navLinks.addEventListener("click", closeMenu);

    function toggleMenu() {
        navLinks.classList.toggle("open");
        const isOpen = navLinks.classList.contains("open");
        menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
    }

    function closeMenu() {
        navLinks.classList.remove("open");
        menuBtnIcon.setAttribute("class", "ri-menu-line");
    }

    // Formulaire multi-étapes
    const form = document.getElementById("msform");
    const previousButtons = form.querySelectorAll(".previous");

    // Ajout de l'écouteur d'événement "submit"
    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Empêche le rechargement de la page

        // Préparation des données à envoyer
        const formData = new FormData(form); // Récupération des données du formulaire

        // Ajout dynamique de "idTrans" si non existant
        if (!formData.has("idTrans")) {
            formData.append("idTrans", idTrans); // Ajout de idTrans = 1
        }

        // Conversion des données en objet JSON
        const data = Object.fromEntries(formData.entries());

        // Envoi de la requête fetch à "/colis/ajouter-users"
        fetch("/colis/ajouter-users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data) // Conversion des données en chaîne JSON
        })
            .then(response => {
                if (!response.ok && response.status === 401) {
                    // Redirection vers la page de connexion si l'utilisateur n'est pas connecté
                    window.location.href = "/connexion";
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (data) {
                    //console.log("Succès:", data);
                    // Redirection vers une autre page après la réussite de la soumission
                    window.location.href = "/";
                }
            })
            .catch(error => {
                console.error("Erreur:", error);
                // Gérer les erreurs ici
            });

        event.preventDefault(); // Empêche la soumission par défaut du formulaire
    });

    //Une fonction qui verifie si tous les champs sont remplis
    function validerChamps() {
        const fieldsetActuel = document.querySelectorAll("fieldset")[0];
        let verification = true;

        //on selectionne toud les champs input et select 
        const champsInputSelect = fieldsetActuel.querySelectorAll("input,select");

        //On parcours tous les champs input de la recherche et on vérifie si ils sont remplis ou non si oui 

        champsInputSelect.forEach(champ => {
            if (!champ.value.trim()) {
                verification = false;
                champ.classList.add("error");
                champ.classList.remove("valid");
                return false;
            }
        })

        return verification ? true : false;
    }

    // Ajouter un écouteur d'événement `click` sur le bouton de recherche
    const rechercheButton = document.querySelector('.search-button');
    rechercheButton.addEventListener('click', function (event) {
        event.preventDefault();
        //mettreAJourEtatBoutonSuivant(); // Mettre à jour l'état du bouton "Suivant" après la recherche

        if (validerChamps()) {
            const modeLivraisonId = voieSelect.value;
            const villeDepart = paysSelectDepart.value.trim();
            const villeArrivee = paysSelectArrive.value.trim();

            if (modeLivraisonId && villeDepart && villeArrivee) {
                chargerTransporteurs(modeLivraisonId, villeDepart, villeArrivee);
            } else {
                rechercheContainer.innerHTML = '<p>Veuillez sélectionner un pays de depart, d\'arrivee,la date, type de transport et un poids.</p>';
            }
        }
        else {
            rechercheContainer.innerHTML = '<p>Veuillez sélectionner un pays de depart, d\'arrivee,la date, type de transport et un poids.</p>';
        }

        //Attendre que le DOM soit chargé 

        setTimeout(() => {
            // Sélectionner la div contenant les radios
            const rechercheDiv = document.getElementById('recherche');

            if (rechercheDiv) {
                // Récupérer tous les inputs de type radio dans la div
                const divResult = rechercheDiv.querySelectorAll('.result');
                const radios = rechercheDiv.querySelectorAll('input[type="radio"]');

                divResult.forEach((resul) => {
                    resul.querySelector('input[type="radio"]').addEventListener('change', (event) => {
                        // Je vais extraire l'id de transporteur seulement
                        const idTransporteur = event.target.value.split('-')[1];
                        //console.log(idTransporteur);
                        idTrans = parseInt(idTransporteur);
                    });
                });
            } else {
                console.log("La div #recherche n'est pas trouvée ou n'existe pas encore.");
            }
        }, 1000);

    });

    // Requête AJAX pour remplir le menu déroulant des modeTransport ou voie
    fetch('/modeLivraison')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('voieSelect');
            if (Array.isArray(data.modeLivraison) && data.modeLivraison.length > 0) {
                data.modeLivraison.forEach(pays => {
                    const option = document.createElement('option');
                    option.value = pays.id;
                    option.textContent = `${pays.libelle},${pays.description}`;
                    select.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.textContent = "Aucune voie disponible";
                //option.disabled = true;
                select.appendChild(option);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des pays :', error);
            const select = document.getElementById('paysSelect');
            const option = document.createElement('option');
            option.textContent = "Erreur de chargement";
            //option.disabled = true;
            select.appendChild(option);
        });

    // Affichage des transporteurs disponibles pour le mode de livraison sélectionné

    // Requête AJAX pour remplir le menu déroulant des transporteurs
    const voieSelect = document.getElementById('voieSelect');
    const paysSelectDepart = document.querySelector('input[placeholder="Départ"]');
    const paysSelectArrive = document.querySelector('input[placeholder="Destination"]');
    const rechercheContainer = document.getElementById('recherche');
    const poidsInput = document.querySelector('input[name="poids"]'); // Sélection du poids

    async function chargerTransporteurs(modeLivraisonId, villeD, villeA) {
        const dateD = document.querySelector(".date-input-depart").value || "Non renseigné";
        try {
            const response = await fetch('/utilisateurs/utilisateurs-trans');
            if (!response.ok) {
                throw new Error("Erreur HTTP : " + response.status);
            }

            const data = await response.json();
            rechercheContainer.innerHTML = ''; // Réinitialiser les résultats

            if (Array.isArray(data.users) && data.users.length > 0) {
                //console.log(data.users[0].transport[0],dateD,villeA,villeD);//.dateDepart.split('T')[0]
                const transporteursFiltres = data.users.filter(user =>
                    user.transport.some(transport => transport.modeLivraisonId === parseInt(modeLivraisonId) &&
                        //transport.paysArrive.villes.some(ville => ville.nom.toLowerCase() === villeA.toLowerCase()) &&
                        //transport.paysDepart.villes.some(ville => ville.nom.toLowerCase() === villeD.toLowerCase()))
                        transport.villeArrive.toLowerCase() === villeA.toLowerCase() &&
                        transport.villeDepart.toLowerCase() === villeD.toLowerCase()
                        && transport.dateDepart.split('T')[0].toLowerCase() === dateD.toLowerCase()
                        ) //&&
                        //transport.dateArrive.toLowerCase() === dateA.toLowerCase() 
                       

                );

                if (transporteursFiltres.length > 0) {
                    transporteursFiltres.forEach((transporteur, index) => {
                        const poids = parseFloat(poidsInput.value || 0); // Valeur par défaut : 0
                        const transport = transporteur.transport.find(t => t.modeLivraisonId === parseInt(modeLivraisonId));
                        const prixTotal = poids * (transport?.prix || 0);
                        const symbole = transport?.paysDepart?.monnaie || "€";

                        // Ajouter les détails du transporteur avec un bouton radio
                        const result = document.createElement('div');
                        result.classList.add('result', 'transporteur-item');
                        result.dataset.index = index; // Identifier chaque élément

                        result.innerHTML = `
                            <div class="transporteur-details">
                            <label for="transporteur-${index}">
                            <i class="icon fas fa-user" id="icon"></i>
                            <p id="prenom"><strong>Prénom :</strong> ${transporteur.firstname}</p>
                            <p id="nom"><strong>Nom :</strong> ${transporteur.lastname}</p>
                            <p id="prix" ><strong>Prix :</strong> ${prixTotal.toFixed(2)} ${symbole}</p>
                            </label>
                            <input type="radio"  value="${index}-${transporteur.id}" name="age" id="transporteur-radio">
                            </div>
                        `;

                        rechercheContainer.appendChild(result);
                    });
                } else {
                    afficherMessage("Aucun transporteur disponible pour ce mode de livraison et cette ville.");
                }
            } else {
                afficherMessage("Aucun transporteur trouvé.");
            }
        } catch (error) {
            afficherMessage("Erreur de chargement des transporteurs.");
            console.error(error);
        }
    }

    function afficherMessage(message) {
        const messageElem = document.createElement('p');
        messageElem.textContent = message;
        rechercheContainer.appendChild(messageElem);
    }

    // Recherche de départ

    const departInput = document.querySelector('input[placeholder="Départ"]');
    const resultsContainerDepart = document.createElement("div");
    resultsContainerDepart.classList.add("results-container1");
    departInput.parentNode.appendChild(resultsContainerDepart);

    departInput.addEventListener("input", async function () {
        const searchQuery = departInput.value.trim();

        // Vérifie si la recherche n'est pas vide
        if (searchQuery.length === 0) {
            resultsContainerDepart.innerHTML = "";
            return;
        }

        try {
            const response = await fetch(`/ville/villes?search=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            // Vide les résultats précédents
            resultsContainerDepart.innerHTML = "";

            // Vérifie la structure des données
            if (data && data.villes) {
                data.villes.forEach(ville => {
                    const villeElement = document.createElement("div");
                    villeElement.classList.add("result-item");
                    villeElement.textContent = `${ville.nom},${ville.pays.nom || 'Pays inconnu'}`; // Affiche le nom de la ville et le nom du pays si disponible

                    // Lorsqu'on clique sur un résultat, il est inséré dans l'input
                    villeElement.addEventListener("click", () => {
                        departInput.value = ville.nom;
                        resultsContainerDepart.innerHTML = "";
                    });

                    resultsContainerDepart.appendChild(villeElement);
                });
            } else {
                console.warn("Format de données inattendu:", data);
            }
        } catch (error) {
            console.error("Erreur lors de la recherche des villes:", error);
        }
    });

    // Recherche de destination

    const arriveInput = document.querySelector('input[placeholder="Destination"]');
    const resultsContainerArrive = document.createElement("div");
    resultsContainerArrive.classList.add("results-container1");
    arriveInput.parentNode.appendChild(resultsContainerArrive);

    arriveInput.addEventListener("input", async function () {
        const searchQuery = arriveInput.value.trim();

        // Vérifie si la recherche n'est pas vide
        if (searchQuery.length === 0) {
            resultsContainerArrive.innerHTML = "";
            return;
        }

        try {
            const response = await fetch(`/ville/villes?search=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            // Vide les résultats précédents
            resultsContainerArrive.innerHTML = "";

            // Vérifie la structure des données
            if (data && data.villes) {
                data.villes.forEach(ville => {
                    const villeElement = document.createElement("div");
                    villeElement.classList.add("result-item");
                    villeElement.textContent = `${ville.nom},${ville.pays.nom || 'Pays inconnu'}`; // Affiche le nom de la ville et le nom du pays si disponible

                    // Lorsqu'on clique sur un résultat, il est inséré dans l'input
                    villeElement.addEventListener("click", () => {
                        arriveInput.value = ville.nom;
                        resultsContainerArrive.innerHTML = "";
                    });

                    resultsContainerArrive.appendChild(villeElement);
                });
            } else {
                console.warn("Format de données inattendu:", data);
            }
        } catch (error) {
            console.error("Erreur lors de la recherche des villes:", error);
        }
    });

    let currentStep = 0;
    // On ecoute le bouton suivant
    const boutonSuivant = document.querySelectorAll(".next");

    // Fonction qui permet de passer d'un fieldset à l'autre
    function allerAuFieldsetSuivant(indexProchainFieldset) {
        const fieldsets = document.querySelectorAll('fieldset');

        fieldsets.forEach((fieldset, index) => {
            if (index === indexProchainFieldset - 1) {
                fieldset.style.display = 'none'; // Cache l'actuel
            } else if (index === indexProchainFieldset) {
                fieldset.style.display = 'block'; // Affiche le prochain
            }
        });
    }

    function allerAuFieldsetPrecedent(indexProchainFieldset) {
        const fieldsets = document.querySelectorAll('fieldset');

        fieldsets.forEach((fieldset, index) => {
            if (index === indexProchainFieldset) {
                fieldset.style.display = 'none'; // Cache l'actuel
            } else if (index === indexProchainFieldset - 1) {
                fieldset.style.display = 'block'; // Affiche le precedent
            }
        });
    }

    // Fonction pour vérifier si les champs sont remplis dans le deuxieme fieldset
    function validerChampsInput() {
        const fieldsetActuel = document.querySelectorAll("fieldset")[1];
        let verification = true;

        //on selectionne toud les champs input
        const champsInputSelect = fieldsetActuel.querySelectorAll("input");

        //On parcours tous les champs input de la recherche et on vérifie si ils sont remplis ou non si oui 
        //console.log(champsInputSelect[2]);

        champsInputSelect.forEach(champ => {
            if (!champ.value.trim()) {
                verification = false;
                champ.classList.add("error");
                champ.classList.remove("valid");
                return false;
            }
        })

        return verification ? true : false;
    }

    //Une fonction pour afficher les informations du récapitulatif
    function afficherRecap() {
        // Informations du colis
        const poids = document.querySelector("input[name='poids']").value || "Non renseigné";
        const villeDepart = document.querySelector("input[placeholder='Départ']").value || "Non renseigné";
        const villeArrivee = document.querySelector("input[placeholder='Destination']").value || "Non renseigné";
        const dateD = document.querySelector("input[name='jours']").value || "Non renseigné";
        //const dateA = document.querySelector("input[placeholder='Destination']").value || "Non renseigné";
        const voie = document.getElementById("voieSelect")?.selectedOptions[0]?.textContent || "Non renseigné";
        const transporteur = document.getElementById("transporteurSelect")?.selectedOptions[0]?.textContent || "Non renseigné";

        // Récapitulatif des informations colis
        document.getElementById("recapPoids").textContent = poids;
        document.getElementById("recapVilleDepart").textContent = villeDepart;
        document.getElementById("recapVilleArrivee").textContent = villeArrivee;
        document.getElementById("recapVoie").textContent = voie;
        document.getElementById("recapTransporteur").textContent = transporteur;

        // Informations sur le destinataire
        const firstname = document.querySelector("input[name='firstname']").value || "Non renseigné";
        const lastname = document.querySelector("input[name='lastname']").value || "Non renseigné";
        const phone = document.querySelector("input[name='phone']").value || "Non renseigné";
        const email = document.querySelector("input[name='emailDestinateur']").value || "Non renseigné";

        // Récapitulatif des informations destinataire
        document.getElementById("recapFirstname").textContent = firstname;
        document.getElementById("recapLastname").textContent = lastname;
        document.getElementById("recapPhone").textContent = phone;
        document.getElementById("recapEmail").textContent = email;
    }

    // Fonction pour gérer les transitions entre fieldsets et step
    function transitionFieldset(index, isNext) {

        // Mise à jour de la barre de progression
        if (isNext) {
            $("#progressbar li").eq(index).addClass("active");
        } else {
            $("#progressbar li").eq(index + 1).removeClass("active");
        }
    }

    boutonSuivant.forEach(bouton => { // Bouton suivants

        //si on clique sur le bouton suivant on parcours les fieldsets
        //console.log("Bouton trouvé:", bouton);
        bouton.addEventListener("click", function (event) {
            //console.log("Bouton cliqué:", bouton,currentStep, idTrans);

            if (currentStep === 0 && idTrans != -1) {

                currentStep++;
                //On parcours le menu des etapes "step"
                transitionFieldset(currentStep, true);

                // Mettre à jour l'état du bouton "Suivant" après la recherche
                allerAuFieldsetSuivant(currentStep);
                afficherRecap();
            }
            else if (currentStep === 1) {
                if (validerChampsInput()) {

                    currentStep++;
                    //On parcours le menu des etapes "step"
                    transitionFieldset(currentStep, true);

                    // Mettre à jour l'état du bouton "Suivant" après la recherche
                    allerAuFieldsetSuivant(currentStep);
                }
                else {
                    //on cree un message que le champs est invalide
                    let message = document.createElement("p");
                    message.innerHTML = "Les champs sont invalides";
                    message.classList.add("messageErreur");
                    document.querySelectorAll("fieldset")[1].appendChild(message);
                }
            }
        });
    });

    previousButtons.forEach(bouton => { // Boutons précédents
        bouton.addEventListener("click", function () {
            // On se retourne au precedent
            allerAuFieldsetPrecedent(currentStep);
            currentStep--;
            // Appeler la fonction de transition
            transitionFieldset(currentStep, false);
        });
    });

});