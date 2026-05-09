export class AuthView {
    constructor() {
        // 1º FABRICAMOS EL MODAL (¡Esto era lo que faltaba!)
        this.inyectarHTML();

        // 2º Ahora ya podemos capturarlo sin que de error
        this.modal = document.getElementById("modal-auth");
        this.form = document.getElementById("auth-form");
        this.title = document.getElementById("modal-title");
        this.btnSubmit = document.getElementById("auth-submit");
        
        // Elementos de la cabecera
        this.btnLogin = document.getElementById("btn-login");
        this.btnSignup = document.getElementById("btn-signup");
        this.btnLogout = document.getElementById("btn-logout");

        this.btnNuevaOp = document.getElementById("btn-nueva-operacion");
        this.btnAdminUsuarios = document.getElementById("btn-gestionar-usuarios");
        this.btnAdminOperadores = document.getElementById("btn-gestionar-operadores");
        this.btnAdminPuntos = document.getElementById("btn-gestionar-puntos");
    }

    inyectarHTML() {
        if (document.getElementById("modal-auth")) return; // Evita duplicados
        /* html */
        const html = `
        <aside id="modal-auth" class="modal-overlay hidden">
            <article class="modal-content">
                <span id="close-modal" class="close">&times;</span>
                <h2 id="modal-title">Iniciar Sesión</h2>
                <form id="auth-form">
                    <div class="form-group">
                        <label for="auth-email">Email</label>
                        <input type="email" id="auth-email" required placeholder="tu@email.com">
                    </div>
                    <div class="form-group">
                        <label for="auth-password">Contraseña</label>
                        <input type="password" id="auth-password" required placeholder="••••••••">
                    </div>
                    <button type="submit" id="auth-submit" class="btn-full">Confirmar</button>
                </form>
            </article>
        </aside>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    show(esRegistro = false) {
        if(!this.modal) return;
        this.modal.classList.remove("hidden");
        this.title.innerText = esRegistro ? "Crear Cuenta" : "Iniciar Sesión";
        this.btnSubmit.innerText = esRegistro ? "Registrarse" : "Entrar";
        this.form.dataset.mode = esRegistro ? "signup" : "login";
    }

    hide() {
        this.modal.classList.add("hidden");
        this.form.reset();
    }

    renderAuthButtons(usuarioLogueado) {
        const botonesGestor = [this.btnNuevaOp, this.btnAdminUsuarios, this.btnAdminOperadores, this.btnAdminPuntos];

        if (usuarioLogueado) {
            this.btnLogin?.classList.add("hidden");
            this.btnSignup?.classList.add("hidden");
            this.btnLogout?.classList.remove("hidden");
            
            if (usuarioLogueado.rol === "GESTOR") {
                botonesGestor.forEach(btn => btn?.classList.remove("hidden"));
            } else {
                botonesGestor.forEach(btn => btn?.classList.add("hidden"));
            }
        } else {
            this.btnLogin?.classList.remove("hidden");
            this.btnSignup?.classList.remove("hidden");
            this.btnLogout?.classList.add("hidden");
            botonesGestor.forEach(btn => btn?.classList.add("hidden"));
        }
    }
}