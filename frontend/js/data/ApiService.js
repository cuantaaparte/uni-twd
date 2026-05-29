const API_BASE = "http://localhost:8000/api/v1";
const AUTH_URL = "http://localhost:8000/access_token";

export class ApiService {
    
    // 🛠️ Función interna que hace el trabajo sucio de preparar la pulsera (Token)
    static async #peticion(endpoint, metodo = "GET", body = null) {
        const token = sessionStorage.getItem("jwt_token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const opciones = { method: metodo, headers };
        if (body) opciones.body = JSON.stringify(body);

        const res = await fetch(`${API_BASE}${endpoint}`, opciones);
        
        // El escudo para los 404 (tablas vacías)
        if (res.status === 404) return []; 
        
        if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
        
        return await res.json();
    }

    // 🛡️ ESCUDO BLINDADO MEJORADO: Busca en varios idiomas
    static #aseguraArray(datos, clavesPosibles) {
        if (Array.isArray(datos)) return datos; 
        for (const clave of clavesPosibles) {
            if (datos && Array.isArray(datos[clave])) return datos[clave]; 
        }
        return []; 
    }

    // ==========================================
    // 🔐 AUTENTICACIÓN
    // ==========================================
    static async login(email, password) {
        const res = await fetch(AUTH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: email, password: password })
        });
        if (!res.ok) throw new Error("Credenciales incorrectas");
        return await res.json();
    }

    static async register(email, password) {
        const res = await fetch(`${API_BASE}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }) 
        });
        if (!res.ok) throw new Error("El email ya existe o no cumple los requisitos");
        return await res.json();
    }

    // ==========================================
    // ✈️ TABLERO Y CATÁLOGOS (Lecturas blindadas)
    // ==========================================
    static async getOperaciones() {
        const data = await this.#peticion("/operations");
        return this.#aseguraArray(data, ["operations", "operaciones"]);
    }

    static async getOperadores() {
        const data = await this.#peticion("/operators");
        return this.#aseguraArray(data, ["operators", "operadores"]);
    }

    static async getPuntos() {
        const data = await this.#peticion("/spots");
        return this.#aseguraArray(data, ["spots", "puntos"]);
    }

    // ==========================================
    // 👥 USUARIOS
    // ==========================================
    static async getUsers() {
        const data = await this.#peticion("/users");
        // Le decimos al escudo que busque la lista venga como venga
        return this.#aseguraArray(data, ["users", "usuarios", "user"]); 
    }

    static async updateRolUser(userId, scopes) {
        return await this.#peticion(`/users/${userId}`, "PUT", { scopes });
    }

    // ==========================================
    // 🏢 OPERADORES Y PUNTOS (Crear y Borrar)
    // ==========================================
    static async createOperador(datos) {
        return await this.#peticion("/operators", "POST", datos);
    }

    static async deleteOperador(id) {
        // En TDW las APIs suelen devolver 204 No Content al borrar, lo cual a veces rompe el res.json()
        // Hacemos el fetch manual aquí para hacerlo súper seguro
        const token = sessionStorage.getItem("jwt_token");
        const res = await fetch(`${API_BASE}/operators/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("No se pudo borrar el operador (¿quizás tiene vuelos asignados?)");
        return true;
    }

    static async createPunto(datos) {
        return await this.#peticion("/spots", "POST", datos);
    }

    static async deletePunto(id) {
        const token = sessionStorage.getItem("jwt_token");
        const res = await fetch(`${API_BASE}/spots/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("No se pudo borrar el punto");
        return true;
    }

    // ==========================================
    // ✈️ OPERACIONES (Crear, Editar, Borrar)
    // ==========================================
    static async createOperacion(datos) {
        return await this.#peticion("/operations", "POST", datos);
    }

    static async updateOperacion(id, datos) {
        // Asumiendo que tu API usa PUT para actualizar
        return await this.#peticion(`/operations/${id}`, "PUT", datos);
    }

    static async deleteOperacion(id) {
        const token = sessionStorage.getItem("jwt_token");
        const res = await fetch(`${API_BASE}/operations/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("No se pudo borrar la operación");
        return true;
    }
}