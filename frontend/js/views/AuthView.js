export class AuthView {
    constructor() {
        this.inyectarHTML();

        this.modal = document.getElementById("modal-auth");
        this.form = document.getElementById("auth-form");
        this.title = document.getElementById("modal-title");
        this.btnSubmit = document.getElementById("auth-submit");
        
        this.btnLogin = document.getElementById("btn-login");
        this.btnSignup = document.getElementById("btn-signup");
        this.btnLogout = document.getElementById("btn-logout");

        this.btnNuevaOp = document.getElementById("btn-nueva-operacion");
        this.btnAdminUsuarios = document.getElementById("btn-gestionar-usuarios");
        this.btnAdminOperadores = document.getElementById("btn-gestionar-operadores");
        this.btnAdminPuntos = document.getElementById("btn-gestionar-puntos");
    }

    inyectarHTML() {
        if (document.getElementById("modal-auth")) return; 
        
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
        if (!this.modal) return;
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

        // Buscamos si ya existe la "píldora" del usuario en el DOM
        let userBadge = document.getElementById("user-badge");

        if (usuarioLogueado) {
            this.btnLogin?.classList.add("hidden");
            this.btnSignup?.classList.add("hidden");
            this.btnLogout?.classList.remove("hidden");
            
            // --- 🎨 NUEVO: CREAR Y MOSTRAR LA PÍLDORA DEL USUARIO ---
            if (!userBadge) {
                userBadge = document.createElement("div");
                userBadge.id = "user-badge";
                // Le metemos los estilos para que quede exactamente como en tu captura
                userBadge.style.cssText = "display: inline-flex; align-items: center; gap: 8px; margin-right: 15px; background: var(--panel-bg, #2a2d3e); padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border-color, #444); color: #fff;";
                
                // Lo insertamos justo antes del botón de Cerrar Sesión
                this.btnLogout.parentNode.insertBefore(userBadge, this.btnLogout);
            }
            
            // Recortamos el email para coger solo el nombre (ej: admin@etsisi.upm.es -> admin)
            const nombreCorto = usuarioLogueado.email.split('@')[0];
            // Color dinámico: Verde para GESTOR, Azul para PÚBLICO
            const colorRol = usuarioLogueado.rol === "GESTOR" ? "#2ecc71" : "#3498db"; 
            
            userBadge.innerHTML = `
                <span style="font-size: 0.95rem;">🧑‍💼 ${nombreCorto}</span>
                <span style="background: ${colorRol}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; letter-spacing: 0.5px;">${usuarioLogueado.rol}</span>
            `;
            userBadge.classList.remove("hidden");
            // --------------------------------------------------------

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
            
            // Si cierra sesión, escondemos la píldora
            if (userBadge) userBadge.classList.add("hidden");
        }
    }
}