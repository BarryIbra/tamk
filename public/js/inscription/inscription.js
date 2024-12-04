document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector(".form");
    const formInputs = document.querySelectorAll(".form .input input, .form .input select");
    const switchMode = document.querySelector(".switch-mode-content");
    const paysSelect = document.getElementById("paysSelect");
    const errorContainer = document.createElement("div");
    errorContainer.id = 'error-container';
    errorContainer.style.display = 'none';
    form.insertBefore(errorContainer, form.firstChild);

   // Mode sombre/clair
    switchMode.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        switchMode.parentElement.classList.toggle("dark-mode");

        // On definit les couleurs des éléments en fonction du mode
        const elementsToToggle = [
            document.querySelector("h1"),
            document.querySelector("a"),
            document.querySelector("p"),
            document.querySelector(".txt"),
            document.querySelector("#error-container")
        ];
        
        const color = document.body.classList.contains("dark-mode") ? "white" : "black";
        
        elementsToToggle.forEach(element => {
            if (element) {
                element.style.color = color;
            }
        });
    });


    // Remplir la liste des pays
    fetch('/pays')
        .then(response => response.json())
        .then(data => {
            //console.log(data);
            
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(pays => {
                    const option = document.createElement('option');
                    option.value = pays.id;
                    option.textContent = `${pays.nom} (${pays.codeCountry})`;
                    paysSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.textContent = "Aucun pays disponible";
                option.disabled = true;
                paysSelect.appendChild(option);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des pays:', error);
            const option = document.createElement('option');
            option.textContent = "Erreur de chargement";
            option.disabled = true;
            paysSelect.appendChild(option);
        });

    // Validation du formulaire
    function validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return emailRegex.test(email);
    }

    //On fait une verification apres la soumission
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        let isValid = true;
        errorContainer.innerHTML = "";
        errorContainer.style.display = 'none';

        formInputs.forEach(input => {
            if (input.type !== 'submit') {
                if (!input.value) {
                    input.style.border = "2px solid red";
                    isValid = false;
                    //errorContainer.innerHTML += `<p>${input.placeholder} est requis</p>`;
                } else {
                    input.style.border = "";
                }
                if (input.name === 'email' && !validateEmail(input.value)) {
                    input.style.border = "2px solid red";
                    isValid = false;
                    //errorContainer.innerHTML += "<p>Adresse email invalide</p>";
                }
            }
        });

        const password = form.querySelector("input[name='password']");
        const passwordVerification = form.querySelector("input[name='passwordVerification']");
        if (password.value !== passwordVerification.value) {
            password.style.border = passwordVerification.style.border = "2px solid red";
            isValid = false;
            //errorContainer.innerHTML += "<p>Les mots de passe ne correspondent pas</p>";
        }

        if (isValid) {
            // Si tout est Ok alors on fait la soumissons
            const formData = {
                firstname: form.querySelector("input[name='prenom']").value,
                lastname: form.querySelector("input[name='nom']").value,
                phone: form.querySelector("input[name='phone']").value,
                dateNaissance: form.querySelector("input[name='dateNaissance']").value,
                pays: paysSelect.value,
                email: form.querySelector("input[name='email']").value,
                password: password.value
            };

            fetch('/utilisateurs/creation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.error) {
                    errorContainer.innerHTML = data.error;
                    errorContainer.style.display = 'block';
                } else {
                    form.reset();
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else {
                        errorContainer.innerHTML = 'Erreur: aucune redirection spécifiée.';
                        errorContainer.style.display = 'block';
                    }
                }
            })
            .catch(() => {
                errorContainer.innerHTML = 'Une erreur est survenue. Veuillez réessayer.';
                errorContainer.style.display = 'block';
            });
        } else {
            errorContainer.style.display = 'block';
        }
    });

    // Navigation menu
    document.querySelector('.toggle').addEventListener('click', function() {
        document.querySelector('.links').classList.toggle('active');
    });

    // Sélection de la langue
    const languageToggle = document.querySelector(".langue");
    const languageDropdown = document.querySelector(".dropdown");
    languageToggle.addEventListener("click", () => {
        languageDropdown.classList.toggle("show");
    });
    
    // Formulaire multi-étapes
    let current_fs, next_fs, previous_fs;
    let current = 1;
    const steps = $("fieldset").length;
    setProgressBar(current);

    $(".next").click(function() {
        current_fs = $(this).parent();
        next_fs = $(this).parent().next();
        $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
        
        next_fs.show();
        current_fs.animate({opacity: 0}, {
            step: function(now) {
                current_fs.css({'display': 'none', 'position': 'relative'});
                next_fs.css({'opacity': 1 - now});
            },
            duration: 500
        });
        setProgressBar(++current);
    });

    $(".previous").click(function() {
        current_fs = $(this).parent();
        previous_fs = $(this).parent().prev();
        $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");
        
        previous_fs.show();
        current_fs.animate({opacity: 0}, {
            step: function(now) {
                current_fs.css({'display': 'none', 'position': 'relative'});
                previous_fs.css({'opacity': 1 - now});
            },
            duration: 500
        });
        setProgressBar(--current);
    });

    function setProgressBar(curStep) {
        const percent = (100 / steps * curStep).toFixed();
        $(".progress-bar").css("width", percent + "%");
    }
});
