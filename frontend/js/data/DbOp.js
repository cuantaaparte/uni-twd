import { Mappers } from "./Mappers.js";

const API_URL = "http://localhost:8000/api/v1"; 

export class DbOp {

    // ==========================================
    //  MOTOR INTERNO 
    // ==========================================
    static async #peticion(endpoint, method = "GET", body = null, customHeaders = {}) {
        const token = sessionStorage.getItem("jwt_token");
        
        // Fusionamos las cabeceras por defecto con las especiales (como el If-Match)
        const headers = { "Content-Type": "application/json", ...customHeaders };
        
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        const res = await fetch(`${API_URL}${endpoint}`, config);
        
        if (res.status === 404 && method === "GET") return [];
        
        if (!res.ok) {
            const errorTxt = await res.text();
            console.error(`🚨 Error en ${endpoint}:`, errorTxt);
            throw new Error(`Fallo en el servidor: HTTP ${res.status}`);
        }
        
        if (res.status === 204) return true; 
        
        return await res.json();
    }

    // ==========================================
    //  AUTENTICACIÓN / SESIÓN
    // ==========================================
    static async login(email, password) {
        console.log("🔐 Intentando login con:", email);
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const res = await fetch(`http://localhost:8000/access_token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData
        });

        if (!res.ok) {
            console.error("🚨 Error de servidor en Login:", res.status);
            throw new Error(`Credenciales incorrectas (HTTP ${res.status})`);
        }
        
        const data = await res.json();
        sessionStorage.setItem("jwt_token", data.access_token);
        return data;
    }

    static async register(email, password) {
        console.log("📝 Intentando registrar en servidor:", email);
        sessionStorage.removeItem("jwt_token"); 

        
        const datosUsuario = {
            username: email.split('@')[0], 
            email: email,
            password: password
        };

        try {
            await this.#peticion("/users", "POST", datosUsuario);
            console.log("✅ Usuario creado con éxito en MySQL");
            return true;
        } catch (error) {
            console.error("🚨 Error capturado en el Registro:", error);
            throw new Error(error.message);
        }
    }

    // ==========================================
    //  GESTIÓN DE USUARIOS
    // ==========================================
    static async getUsers() {
        const data = await this.#peticion("/users");
        return Mappers.mapLista(data, Mappers.mapUsuario);
    }

    static async updateRolUser(id, rolParam) {
        // 1. Extraemos el texto puro del array (El Swagger pide "PUBLICO", no ["PUBLICO"])
        const nuevoRol = Array.isArray(rolParam) ? rolParam[0] : rolParam;

        // 2. GET EXPLÍCITO: Bajamos el usuario fresco para obtener su huella (ETag)
        const token = sessionStorage.getItem("jwt_token");
        const getRes = await fetch(`${API_URL}/users/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!getRes.ok) throw new Error("No se pudo obtener la firma de seguridad (ETag) del usuario.");
        
        const etag = getRes.headers.get("ETag"); // 🗝️ ¡Aquí robamos la llave de la cabecera!
        const data = await getRes.json();
        
        // El Swagger nos devuelve los datos anidados dentro de "user"
        const usuarioActual = data.user || data;

        // 3. CONSTRUCCIÓN DEL PAQUETE: Replicamos el modelo exacto del Swagger
        const bodyActualizado = {
            email: usuarioActual.email,
            role: nuevoRol
        };

        // 4. PUT: Disparamos la actualización inyectando la huella en "customHeaders"
        return await this.#peticion(`/users/${id}`, "PUT", bodyActualizado, {
            "If-Match": etag
        });
    }

    // ==========================================
    //  CATÁLOGO: OPERADORES
    // ==========================================
    static async getOperadores() {
        const data = await this.#peticion("/operators");
        return Mappers.mapLista(data, Mappers.mapOperador);
    }

    static async createOperador(datos) {
        await this.#peticion("/operators", "POST", datos);
        return true;
    }

    static async deleteOperador(id) {
        await this.#peticion(`/operators/${id}`, "DELETE");
        return true;
    }

    // ==========================================
    //  CATÁLOGO: PUNTOS (PUERTAS / VÍAS)
    // ==========================================
    static async getPuntos() {
        const data = await this.#peticion("/spots");
        return Mappers.mapLista(data, Mappers.mapPunto);
    }

    static async createPunto(datos) {
        await this.#peticion("/spots", "POST", datos);
        return true;
    }

    static async deletePunto(id) {
        await this.#peticion(`/spots/${id}`, "DELETE");
        return true;
    }

    // ==========================================
    //  OPERACIONES (VUELOS / TRENES)
    // ==========================================
    static async getOperaciones() {
        const data = await this.#peticion("/operations");
        return Mappers.mapLista(data, Mappers.mapOperacion);
    }

    static async createOperacion(datos) {
        // Enviar tal cual, el controlador ya lo prepara
        await this.#peticion("/operations", "POST", datos);
        return true;
    }

    static async updateOperacion(id, datosActualizados) {
        await this.#peticion(`/operations/${id}`, "PUT", datosActualizados);
        return true;
    }

    static async deleteOperacion(id) {
        await this.#peticion(`/operations/${id}`, "DELETE");
        return true;
    }
}