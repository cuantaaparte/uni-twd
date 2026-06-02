import { ICONO_POR_DEFECTO } from "../utils/helpers.js";

export class DbOp {

    // ==========================================
    // 🔐 AUTENTICACIÓN / SESIÓN
    // ==========================================
    static async login(email, password) {
        // 🪄 TRUCO: Ahora el mock SÍ comprueba las credenciales de verdad
        const usuarios = await this.getUsers();
        const usuarioValido = usuarios.find(u => u.email === email && u.password === password);
        
        if (!usuarioValido) throw new Error("Credenciales incorrectas");

        const tokenSimulado = "token_local_key_jwt";
        sessionStorage.setItem("jwt_token", tokenSimulado);
        return { access_token: tokenSimulado };
    }

    static async register(email, password) {
        // 🔧 CORRECCIÓN: Volvemos a usar tu clave original "usuarios"
        let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        usuarios.push({ id: Date.now(), email, password, rol: "PÚBLICO" });
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        return true;
    }

    // ==========================================
    // 👥 GESTIÓN DE USUARIOS
    // ==========================================
    static async getUsers() {
        // 🔧 CORRECCIÓN: Volvemos a usar tu clave original "usuarios" y añadimos contraseñas a la semilla
        const raw = JSON.parse(localStorage.getItem("usuarios")) || [
            { id: 1, email: "admin@etsisi.upm.es", password: "Password123!", rol: "GESTOR" },
            { id: 2, email: "user@etsisi.upm.es", password: "Password123!", rol: "PÚBLICO" }
        ];
        return raw.map(u => ({ ...u, id: u.id || u.userId }));
    }

    static async updateRolUser(userId, nuevoRol) {
        let usuarios = await this.getUsers();
        const idx = usuarios.findIndex(u => String(u.id) === String(userId));
        if (idx !== -1) {
            usuarios[idx].rol = nuevoRol[0]; 
            localStorage.setItem("usuarios", JSON.stringify(usuarios)); // 🔧 CORRECCIÓN AQUÍ TAMBIÉN
        }
        return true;
    }

    // ==========================================
    // 🏢 CATÁLOGO: OPERADORES
    // ==========================================
    static async getOperadores() {
        const raw = JSON.parse(localStorage.getItem("operadores")) || [];
        // 🪄 TRUCO: Si el dato es antiguo (operadorId), lo clonamos como .id para que el front no explote
        return raw.map(o => ({ ...o, id: o.id || o.operadorId }));
    }

    static async createOperador(datos) {
        let op = await this.getOperadores();
        op.push({ 
            id: Date.now(), 
            nombre: datos.nombre, 
            siglas: datos.siglas, 
            urlIcono: datos.urlIcono || ICONO_POR_DEFECTO 
        });
        localStorage.setItem("operadores", JSON.stringify(op));
        return true;
    }

    static async deleteOperador(id) {
        let op = await this.getOperadores();
        const filtrados = op.filter(o => String(o.id) !== String(id));
        localStorage.setItem("operadores", JSON.stringify(filtrados));
        return true;
    }

    // ==========================================
    // 🚏 CATÁLOGO: PUNTOS (PUERTAS / VÍAS)
    // ==========================================
    static async getPuntos() {
        const raw = JSON.parse(localStorage.getItem("puntos")) || [];
        // 🪄 TRUCO: puntoId -> id
        return raw.map(p => ({ ...p, id: p.id || p.puntoId }));
    }

    static async createPunto(datos) {
        let pt = await this.getPuntos();
        pt.push({ 
            id: Date.now(), 
            tipo: datos.tipo, 
            codigo: datos.codigo 
        });
        localStorage.setItem("puntos", JSON.stringify(pt));
        return true;
    }

    static async deletePunto(id) {
        let pt = await this.getPuntos();
        const filtrados = pt.filter(p => String(p.id) !== String(id));
        localStorage.setItem("puntos", JSON.stringify(filtrados));
        return true;
    }

    // ==========================================
    // ✈️ OPERACIONES (VUELOS / TRENES)
    // ==========================================
    static async getOperaciones() {
        const raw = JSON.parse(localStorage.getItem("operaciones")) || [];
        // 🪄 TRUCO: operacionId -> id
        return raw.map(o => ({ ...o, id: o.id || o.operacionId }));
    }

    static async createOperacion(datos) {
        let ops = await this.getOperaciones();
        ops.push({
            id: datos.id || Date.now(),
            tipo: datos.tipo,
            codigo: datos.codigo,
            sentido: datos.sentido,
            origen: datos.origen,
            destino: datos.destino,
            horaProgramada: datos.horaProgramada,
            horaEstimada: datos.horaEstimada,
            estado: datos.estado,
            operadorId: datos.operadorId,
            puntoId: datos.puntoId
        });
        localStorage.setItem("operaciones", JSON.stringify(ops));
        return true;
    }

    static async updateOperacion(id, datosActualizados) {
        let ops = await this.getOperaciones();
        const idx = ops.findIndex(o => String(o.id) === String(id));
        
        if (idx !== -1) {
            ops[idx] = { ...ops[idx], ...datosActualizados };
            localStorage.setItem("operaciones", JSON.stringify(ops));
        }
        return true;
    }

    static async deleteOperacion(id) {
        let ops = await this.getOperaciones();
        const filtrados = ops.filter(o => String(o.id) !== String(id));
        localStorage.setItem("operaciones", JSON.stringify(filtrados));
        return true;
    }
}