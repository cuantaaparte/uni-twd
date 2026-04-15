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

        // 🆕 Botones de GESTOR (IDs corregidos)
        this.btnNuevaOp = document.getElementById("btn-nueva-operacion");
        this.btnAdminUsuarios = document.getElementById("btn-gestionar-usuarios");
        this.btnAdminOperadores = document.getElementById("btn-gestionar-operadores");
        this.btnAdminPuntos = document.getElementById("btn-gestionar-puntos");
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

    // 🔄 LA MAGIA: Cambia qué botones se ven según el Rol
    renderAuthButtons(usuarioLogueado) {
        // 1. Array con los botones de Gestor para manejarlos fácilmente
        const botonesGestor = [
            this.btnNuevaOp, 
            this.btnAdminUsuarios, 
            this.btnAdminOperadores, 
            this.btnAdminPuntos
        ];

        if (usuarioLogueado) {
            // Usuario logueado (sea público o gestor)
            this.btnLogin.classList.add("hidden");
            this.btnSignup.classList.add("hidden");
            this.btnLogout.classList.remove("hidden");
            
            // 👮‍♂️ ¿Es Gestor? Encendemos sus botones
            if (usuarioLogueado.rol === "GESTOR") {
                botonesGestor.forEach(btn => btn?.classList.remove("hidden"));
            } else {
                // Si es público, nos aseguramos de que estén ocultos
                botonesGestor.forEach(btn => btn?.classList.add("hidden"));
            }

        } else {
            // Nadie logueado (Estado por defecto)
            this.btnLogin.classList.remove("hidden");
            this.btnSignup.classList.remove("hidden");
            this.btnLogout.classList.add("hidden");
            
            // Ocultamos los botones de gestión por seguridad
            botonesGestor.forEach(btn => btn?.classList.add("hidden"));
        }
    }
}