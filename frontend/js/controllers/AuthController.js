import { AuthView } from "../views/AuthView.js";
import { DbOp } from "../data/DbOp.js"; 

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
        
        //  FEEDBACK VISUAL: Atrapamos el botón, guardamos su texto y ponemos el reloj
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit.innerText;
        btnSubmit.innerText = "⏳ Esperando al servidor...";
        btnSubmit.disabled = true;
        
        try {
            if (modoFormulario === "login") {
                await DbOp.login(email, password);
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
                if (password.length <= 8 || !/\d/.test(password)) {
                    // Si falla la validación, restauramos el botón antes de salir
                    btnSubmit.innerText = textoOriginal;
                    btnSubmit.disabled = false;
                    return alert("La contraseña debe tener más de 8 caracteres y contener al menos 1 número 🔐");
                }
                
                await DbOp.register(email, password);
                alert("Cuenta creada con éxito ✅ Ya puedes iniciar sesión.");
                this.authView.show(false); 
            }
        } catch (error) {
            alert("❌ Operación fallida: " + error.message);
        } finally {
            //  LIMPIEZA: Pase lo que pase (éxito o error), devolvemos el botón a la normalidad
            btnSubmit.innerText = textoOriginal;
            btnSubmit.disabled = false;
        }
    }
}