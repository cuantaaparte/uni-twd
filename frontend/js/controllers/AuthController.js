import { AuthView } from "../views/AuthView.js";
import { Usuario, ROLES_USUARIO } from "../models/Usuario.js";

export class AuthController {
    constructor(onAuthChangedCallback, authViewInstance = null) {
        this.authView = authViewInstance || new AuthView();
        this.onAuthChanged = onAuthChangedCallback;
        this.initListeners();
        
        const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
        this.authView.renderAuthButtons(usuarioActivo);
    }

    initListeners() {
        document.getElementById("btn-login")?.addEventListener("click", () => this.authView.show(false));
        document.getElementById("btn-signup")?.addEventListener("click", () => this.authView.show(true));
        document.getElementById("close-modal")?.addEventListener("click", () => this.authView.hide());

        document.getElementById("modal-auth")?.addEventListener("click", (e) => {
            if (e.target.id === 'modal-auth') this.authView.hide();
        });

        document.getElementById("auth-form")?.addEventListener("submit", (e) => this.handleAuthSubmit(e));

        document.getElementById("btn-logout")?.addEventListener("click", () => {
            sessionStorage.removeItem("usuarioActivo");
            location.reload(); 
        });
    }

    // ✨ Refactor: Lógica de autenticación aislada
    handleAuthSubmit(e) {
        e.preventDefault();
        const email = document.getElementById("auth-email").value;
        const password = document.getElementById("auth-password").value;
        const modoFormulario = e.target.dataset.mode;
        const usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];

        if (modoFormulario === "login") {
            const usuarioValido = usuariosGuardados.find(u => u.email === email && u.password === password);
            if (usuarioValido) {
                sessionStorage.setItem("usuarioActivo", JSON.stringify(usuarioValido));
                this.authView.hide();
                this.authView.renderAuthButtons(usuarioValido);
                this.onAuthChanged();
            } else {
                alert("Credenciales incorrectas ❌");
            }
        } else {
            if (usuariosGuardados.some(u => u.email === email)) return alert("El Email introducido ya existe ⚠️");
            if (password.length <= 8 || !/\d/.test(password)) return alert("La contraseña debe tener más de 8 caracteres y contener al menos 1 número 🔐");
            
            usuariosGuardados.push(new Usuario(email, password, ROLES_USUARIO.PUBLICO));
            localStorage.setItem("usuarios", JSON.stringify(usuariosGuardados));
            alert("Cuenta creada con éxito ✅");
            this.authView.show(false); 
        }
    }
}