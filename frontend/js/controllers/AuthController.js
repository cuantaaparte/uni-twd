import { AuthView } from "../views/AuthView.js";
import { decodificarJWT } from "../utils/helpers.js";
import { ApiService } from "../data/ApiService.js"; // ✨ IMPORTANTE: Traemos el servicio

export class AuthController {
    constructor(onAuthChangedCallback, authViewInstance = null) {
        this.authView = authViewInstance || new AuthView();
        this.onAuthChanged = onAuthChangedCallback;
        this.initListeners();
        
        this.verificarSesionActiva();
    }

    // 🔍 Comprueba si ya tenemos una pulsera válida al entrar a la web
    verificarSesionActiva() {
        const token = sessionStorage.getItem("jwt_token");
        
        if (token) {
            const payload = decodificarJWT(token);
            console.log("🎟️ Tripas del Token JWT:", payload); 

            if (payload && payload.exp * 1000 > Date.now()) {
                
                // Truco infalible: convertimos todo el token a texto en minúsculas y buscamos "gestor"
                const tokenTexto = JSON.stringify(payload).toLowerCase();
                const rolAsignado = tokenTexto.includes("gestor") ? "GESTOR" : "PÚBLICO";

                // A veces el email viene en 'email', otras en 'sub' (subject) o 'username'
                const emailAsignado = payload.email || payload.sub || payload.username || "Admin";

                const usuarioActivo = { 
                    email: emailAsignado, 
                    rol: rolAsignado 
                };
                
                this.authView.renderAuthButtons(usuarioActivo);
                return;
            } else {
                sessionStorage.removeItem("jwt_token");
            }
        }
        
        this.authView.renderAuthButtons(null);
    }

    initListeners() {
        document.getElementById("btn-login")?.addEventListener("click", () => this.authView.show(false));
        document.getElementById("btn-signup")?.addEventListener("click", () => this.authView.show(true));
        document.getElementById("close-modal")?.addEventListener("click", () => this.authView.hide());

        document.getElementById("modal-auth")?.addEventListener("click", (e) => {
            if (e.target.id === 'modal-auth') this.authView.hide();
        });

        // 🚀 Interceptamos el envío del formulario
        document.getElementById("auth-form")?.addEventListener("submit", (e) => this.handleAuthSubmit(e));

        document.getElementById("btn-logout")?.addEventListener("click", () => {
            sessionStorage.removeItem("jwt_token"); // Rompemos la pulsera
            location.reload(); 
        });
    }

    // 🌐 Peticiones Reales al Servidor Docker (AHORA DELEGADAS)
    async handleAuthSubmit(e) {
        e.preventDefault();
        const email = document.getElementById("auth-email").value;
        const password = document.getElementById("auth-password").value;
        const modoFormulario = e.target.dataset.mode;

        if (modoFormulario === "login") {
            try {
                // 1. Pedimos entrar a través del servicio ✨
                const data = await ApiService.login(email, password);

                // 2. Recogemos el pase VIP
                sessionStorage.setItem("jwt_token", data.access_token);
                
                // 3. Leemos el pase para actualizar la pantalla
                this.verificarSesionActiva();
                this.authView.hide();
                this.onAuthChanged();
                
            } catch (error) {
                alert("❌ Error: " + error.message);
            }
            
        } else {
            // REGISTRO
            try {
                // Delegamos el registro al servicio ✨
                await ApiService.register(email, password);

                alert("✅ Cuenta creada con éxito. Ahora puedes iniciar sesión.");
                this.authView.show(false); // Pasamos la ventana a modo Login
                
            } catch (error) {
                alert("⚠️ Error: " + error.message);
            }
        }
    }
}