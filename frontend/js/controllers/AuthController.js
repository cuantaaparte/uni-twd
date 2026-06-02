import { AuthView } from "../views/AuthView.js";
import { DbOp } from "../data/DbOp.js"; // ✨ NUEVO IMPORT

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
            sessionStorage.removeItem("jwt_token"); // ✨ Limpiamos también el token de seguridad
            location.reload(); 
        });
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        const email = document.getElementById("auth-email").value;
        const password = document.getElementById("auth-password").value;
        const modoFormulario = e.target.dataset.mode;
        
        try {
            if (modoFormulario === "login") {
                // 1. Pedimos a DbOp que intente hacer el login
                await DbOp.login(email, password);
                
                // 2. Si no ha explotado (login correcto), buscamos los datos del usuario
                const usuarios = await DbOp.getUsers();
                const usuarioValido = usuarios.find(u => u.email === email);
                
                if (usuarioValido) {
                    sessionStorage.setItem("usuarioActivo", JSON.stringify(usuarioValido));
                    this.authView.hide();
                    this.authView.renderAuthButtons(usuarioValido);
                    this.onAuthChanged();
                } else {
                    alert("⚠️ Error: Credenciales correctas pero no se encontró el perfil de usuario.");
                }
                
            } else {
                // Validación Frontend básica
                if (password.length <= 8 || !/\d/.test(password)) {
                    return alert("La contraseña debe tener más de 8 caracteres y contener al menos 1 número 🔐");
                }
                
                const usuarios = await DbOp.getUsers();
                if (usuarios.some(u => u.email === email)) {
                    return alert("El Email introducido ya existe ⚠️");
                }
                
                // Pedimos a DbOp que lo registre
                await DbOp.register(email, password);
                
                alert("Cuenta creada con éxito ✅");
                this.authView.show(false); 
            }
        } catch (error) {
            // Si DbOp.login falla (contraseña mal, servidor caído...), salta aquí
            alert("❌ Fallo en la autenticación: " + error.message);
        }
    }
}