

export class AuthView {
    constructor() {
        this.modal = document.getElementById("modal-auth");
        this.form = document.getElementById("auth-form");
        this.title = document.getElementById("modal-title");
        this.btnSubmit = document.getElementById("auth-submit");
        
        // Elementos de la cabecera
        this.btnLogin = document.getElementById("btn-login");
        this.btnSignup = document.getElementById("btn-signup");
        this.btnLogout = document.getElementById("btn-logout");
    }

    // Muestra el modal y ajusta el título según si es Login o Registro
    show(esRegistro = false) {
        this.modal.classList.remove("hidden");
        this.title.innerText = esRegistro ? "Crear Cuenta" : "Iniciar Sesión";
        this.btnSubmit.innerText = esRegistro ? "Registrarse" : "Entrar";
        this.form.dataset.mode = esRegistro ? "signup" : "login";
    }

    hide() {
        this.modal.classList.add("hidden");
        this.form.reset();
    }

    // 🔄 LA MAGIA: Cambia qué botones se ven
    renderAuthButtons(usuarioLogueado) {
        if (usuarioLogueado) {
            this.btnLogin.classList.add("hidden");
            this.btnSignup.classList.add("hidden");
            this.btnLogout.classList.remove("hidden");
            console.log("👤 Usuario detectado:", usuarioLogueado.email);
        } else {
            this.btnLogin.classList.remove("hidden");
            this.btnSignup.classList.remove("hidden");
            this.btnLogout.classList.add("hidden");
        }
    }
}