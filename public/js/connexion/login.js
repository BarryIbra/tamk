document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector(".form"); // Sélectionne l'élément du formulaire
  const form_inputs = document.querySelectorAll(
      ".login-section .form .input input:not(input[type='submit'])"
  );
  const clear_email_txt = document.querySelector(".login-section .clear");
  const show_hide_pass = document.querySelector(".login-section .show-hide-password");
  const errorContainer = document.querySelector('#error-container'); // Conteneur des erreurs

  // * Dark Mode Switch
  const switch_mode = document.querySelector(".switch-mode-content");
  switch_mode.addEventListener("click", () => {
      switch_mode.parentElement.classList.toggle("dark-mode");
      switch_mode.parentElement.nextElementSibling.classList.toggle("dark-mode");
      switch_mode.parentElement.nextElementSibling.nextElementSibling.classList.toggle("dark-mode");
  });

  // * Form Inputs Interaction
  form_inputs.forEach((input) => {
      input.addEventListener("input", () => {
          if (input.value.length > 0) {
              input.nextElementSibling.style.display = "flex";
          } else {
              input.nextElementSibling.style.display = "none";
          }
      });
  });

  // * Clear Email
  clear_email_txt.addEventListener("click", () => {
      clear_email_txt.previousElementSibling.value = "";
      clear_email_txt.style.display = "none";
  });

  // * Show/Hide Password
  show_hide_pass.addEventListener("click", () => {
      show_hide_pass.classList.toggle("show");
      const passwordField = show_hide_pass.previousElementSibling;
      if (show_hide_pass.classList.contains("show")) {
          passwordField.type = "text";
      } else {
          passwordField.type = "password";
      }
  });

  // * Validation de l'Email et Mot de passe
  function validateEmail(email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/; // Vérifie qu'il y a un @ et un .com
      return emailRegex.test(email);
  }

  // * Validation du Formulaire avant l'envoi
  form.addEventListener("submit", (event) => {
      event.preventDefault(); // Empêche l'envoi du formulaire par défaut
      const email = form.querySelector("input[name='email']");
      const password = form.querySelector("input[name='password']");
      let isValid = true;

      // Validation Email
      if (!email.value || !validateEmail(email.value)) {
          email.style.border = "2px solid red"; // Souligne l'email en rouge
          isValid = false;
      } else {
          email.style.border = ""; // Enlève le soulignement rouge si l'email est valide
      }

      // Validation Mot de Passe
      if (!password.value) {
          password.style.border = "2px solid red"; // Souligne le mot de passe en rouge
          isValid = false;
      } else {
          password.style.border = ""; // Enlève le soulignement rouge si le mot de passe est valide
      }

      // Si tout est valide, envoie les données via fetch
      if (isValid) {
        //errorContainer.style.display = 'none'; // Cache les erreurs
        const emailValue = email.value;
        const passwordValue = password.value;
        
        //console.log("cisse");
        fetch('/loginApi', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: emailValue, password: passwordValue }) // Envoie l'email et le mot de passe dans le corps de la requête
          })
          .then(response => response.json())
          .then(data => {
              if (data.error) {
                  errorContainer.innerHTML = data.error;
                  errorContainer.style.display = 'block'; // Affiche l'erreur
              } else {
                  // Si l'authentification est réussie
                  form.reset(); // Réinitialise le formulaire
                  if (data.redirectUrl) {
                      window.location.href = data.redirectUrl; // Redirige l'utilisateur si l'URL est fournie
                  } else {
                      errorContainer.innerHTML = 'Erreur: aucune redirection spécifiée.';
                      errorContainer.style.display = 'block';
                  }
              }
          })
          .catch(error => {
              errorContainer.innerHTML = 'Une erreur est survenue. Veuillez réessayer.';
              errorContainer.style.display = 'block'; // Affiche une erreur générique
          });
      } else {
          errorContainer.innerHTML = "Veuillez remplir correctement tous les champs.";
          errorContainer.style.display = 'block'; // Affiche les erreurs générales
      }
  });
});
