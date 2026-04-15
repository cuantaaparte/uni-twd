// js/controllers/AdminController.js
import { generarULID, ICONO_POR_DEFECTO } from "../utils/helpers.js";

const ROL_GESTOR = "GESTOR";
const ROL_PUBLICO = "PÚBLICO";

export class AdminController {
    constructor(onDataChangedCallback) {
        this.onDataChanged = onDataChangedCallback; // Avisa al TableroController que algo ha cambiado
        this.initListeners();
    }

    initListeners() {
        // Cierre de modales
        ["close-modal-op", "close-modal-crear", "close-modal-usuarios", "close-modal-operadores", "close-modal-puntos"].forEach(id => {
            document.getElementById(id)?.addEventListener("click", (e) => e.target.closest('.modal-overlay').classList.add("hidden"));
        });

        // Formularios Operaciones
        document.getElementById("form-operacion")?.addEventListener("submit", (e) => this.handleEditarOperacion(e));
        document.getElementById("form-crear")?.addEventListener("submit", (e) => this.handleCrearOperacion(e));
        
        // Formularios Nuevos (Operadores y Puntos)
        document.getElementById("form-add-operador")?.addEventListener("submit", (e) => this.handleCrearOperador(e));
        document.getElementById("form-add-punto")?.addEventListener("submit", (e) => this.handleCrearPunto(e));

        // Delegación global para botones de edición, borrado y apertura de modales
        document.body.addEventListener("click", (e) => this.handleGlobalClicks(e));
    }

    handleGlobalClicks(e) {
        // Editar Operacion
        const btnEditarOp = e.target.closest(".btn-editar");
        if (btnEditarOp) {
            const id = btnEditarOp.getAttribute("data-id");
            const op = (JSON.parse(localStorage.getItem("operaciones")) || []).find(o => o.operacionId === id);
            if (op) {
                document.getElementById("op-id").value = op.operacionId;
                document.getElementById("op-estado").value = op.estado;
                
                const operadores = JSON.parse(localStorage.getItem("operadores")) || [];
                const puntos = JSON.parse(localStorage.getItem("puntos")) || [];
                
                document.getElementById("op-operador").innerHTML = operadores.map(o => `<option value="${o.operadorId}" ${o.operadorId === op.operadorId ? 'selected' : ''}>${o.nombre}</option>`).join("");
                document.getElementById("op-punto").innerHTML = puntos.map(p => `<option value="${p.puntoId}" ${p.puntoId === op.puntoId ? 'selected' : ''}>${p.codigo}</option>`).join("");
                
                document.getElementById("modal-operacion")?.classList.remove("hidden");
            }
            return;
        }

        // Borrar Operacion
        const btnBorrarOp = e.target.closest(".btn-borrar");
        if (btnBorrarOp) {
            if (confirm("⚠️ ¿Deseas borrar definitivamente esta operación?")) {
                let ops = JSON.parse(localStorage.getItem("operaciones")) || [];
                localStorage.setItem("operaciones", JSON.stringify(ops.filter(o => o.operacionId !== btnBorrarOp.getAttribute("data-id"))));
                this.onDataChanged();
            }
            return;
        }

        // Apertura Modales Admin
        if (e.target.closest("#btn-nueva-operacion")) {
            const op = JSON.parse(localStorage.getItem("operadores")) || [];
            const pt = JSON.parse(localStorage.getItem("puntos")) || [];
            document.getElementById("crear-operador").innerHTML = op.map(o => `<option value="${o.operadorId}">${o.nombre}</option>`).join("");
            document.getElementById("crear-punto").innerHTML = pt.map(p => `<option value="${p.puntoId}">${p.codigo}</option>`).join("");
            document.getElementById("modal-crear")?.classList.remove("hidden");
        }
        
        if (e.target.closest("#btn-gestionar-usuarios")) { this.renderizarUsuarios(); document.getElementById("modal-usuarios")?.classList.remove("hidden"); }
        if (e.target.closest("#btn-gestionar-operadores")) { this.renderizarOperadores(); document.getElementById("modal-operadores")?.classList.remove("hidden"); }
        if (e.target.closest("#btn-gestionar-puntos")) { this.renderizarPuntos(); document.getElementById("modal-puntos")?.classList.remove("hidden"); }

        // Cambiar Rol Usuario
        const btnRol = e.target.closest(".btn-cambiar-rol");
        if (btnRol) {
            const email = btnRol.getAttribute("data-email");
            const nuevoRol = btnRol.getAttribute("data-rol");
            let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

            if (nuevoRol === ROL_PUBLICO && usuarios.filter(u => u.rol === ROL_GESTOR).length <= 1) {
                return alert("⚠️ ALERTA DE SISTEMA: No puedes degradar al último Gestor disponible.");
            }

            const idx = usuarios.findIndex(u => u.email === email);
            usuarios[idx].rol = nuevoRol;
            localStorage.setItem("usuarios", JSON.stringify(usuarios));

            const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
            if (usuarioActivo && email === usuarioActivo.email) {
                usuarioActivo.rol = nuevoRol;
                sessionStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));
                alert(`Su rol en el sistema ha cambiado a: ${nuevoRol}. Actualizando la interfaz... 🔄`);
                location.reload(); 
                return;
            }
            this.renderizarUsuarios(); 
            // Comprobamos que el callback existe antes de llamarlo para evitar crasheos
            if (typeof this.onDataChanged === 'function') {
                this.onDataChanged();
            }
        }

        // Borrar Operador / Punto
        const btnBorrarOperador = e.target.closest(".btn-borrar-operador");
        if (btnBorrarOperador) {
            const id = parseInt(btnBorrarOperador.getAttribute("data-id"));
            let op = JSON.parse(localStorage.getItem("operadores")) || [];
            localStorage.setItem("operadores", JSON.stringify(op.filter(o => o.operadorId !== id)));
            this.renderizarOperadores(); 
            this.onDataChanged();
        }
        
        const btnBorrarPunto = e.target.closest(".btn-borrar-punto");
        if (btnBorrarPunto) {
            const id = parseInt(btnBorrarPunto.getAttribute("data-id"));
            let pt = JSON.parse(localStorage.getItem("puntos")) || [];
            localStorage.setItem("puntos", JSON.stringify(pt.filter(p => p.puntoId !== id)));
            this.renderizarPuntos(); 
            this.onDataChanged();
        }
    }

    handleCrearOperacion(e) {
        e.preventDefault();
        const hora = new Date(document.getElementById("crear-hora").value).getTime(); 
        if (isNaN(hora)) return;

        let ops = JSON.parse(localStorage.getItem("operaciones")) || [];
        const sentido = document.getElementById("crear-sentido").value;
        const ciudad = document.getElementById("crear-ciudad").value;

        ops.push({
            operacionId: generarULID(), 
            tipo: document.getElementById("crear-tipo").value,
            codigo: document.getElementById("crear-codigo").value,
            sentido: sentido,
            origen: sentido === "llegada" ? ciudad : "Madrid", 
            destino: sentido === "salida" ? ciudad : "Madrid",
            horaProgramada: hora,
            horaEstimada: hora,
            estado: "PROGRAMADO", 
            operadorId: parseInt(document.getElementById("crear-operador").value),
            puntoId: parseInt(document.getElementById("crear-punto").value)
        });
        
        localStorage.setItem("operaciones", JSON.stringify(ops));
        e.target.reset();
        document.getElementById("modal-crear").classList.add("hidden");
        this.onDataChanged();
    }

    handleEditarOperacion(e) {
        e.preventDefault();
        const id = document.getElementById("op-id").value;
        let ops = JSON.parse(localStorage.getItem("operaciones")) || [];
        const idx = ops.findIndex(o => o.operacionId === id);
        
        if (idx !== -1) {
            ops[idx].estado = document.getElementById("op-estado").value;
            ops[idx].operadorId = parseInt(document.getElementById("op-operador").value);
            ops[idx].puntoId = parseInt(document.getElementById("op-punto").value);
            localStorage.setItem("operaciones", JSON.stringify(ops));
            document.getElementById("modal-operacion").classList.add("hidden");
            this.onDataChanged(); 
        }
    }

    handleCrearOperador(e) {
        e.preventDefault();
        let op = JSON.parse(localStorage.getItem("operadores")) || [];
        op.push({ 
            operadorId: Date.now(), 
            nombre: document.getElementById("nuevo-op-nombre").value, 
            siglas: document.getElementById("nuevo-op-siglas").value.toUpperCase(), 
            urlIcono: ICONO_POR_DEFECTO 
        });
        localStorage.setItem("operadores", JSON.stringify(op));
        e.target.reset(); 
        this.renderizarOperadores(); 
        this.onDataChanged();
    }

    handleCrearPunto(e) {
        e.preventDefault();
        let pt = JSON.parse(localStorage.getItem("puntos")) || [];
        pt.push({ 
            puntoId: Date.now(), 
            tipo: document.getElementById("nuevo-pto-tipo").value, 
            codigo: document.getElementById("nuevo-pto-codigo").value.toUpperCase() 
        });
        localStorage.setItem("puntos", JSON.stringify(pt));
        e.target.reset(); 
        this.renderizarPuntos(); 
        this.onDataChanged();
    }

    renderizarUsuarios() {
        const usu = JSON.parse(localStorage.getItem("usuarios")) || [];
        document.getElementById("lista-usuarios").innerHTML = usu.map(u => `
            <article style="display:grid; grid-template-columns:2fr 1fr 1.5fr; padding:10px; border-bottom:1px solid var(--border-color); align-items: center;">
                <span style="font-weight:bold;">${u.email}</span>
                <span style="color:${u.rol === ROL_GESTOR ? '#2ecc71' : '#95a5a6'}; font-size:0.8rem; font-weight:bold;">${u.rol}</span>
                <button class="btn-cambiar-rol" data-email="${u.email}" data-rol="${u.rol === ROL_GESTOR ? ROL_PUBLICO : ROL_GESTOR}" style="background:#3498db; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Cambiar Rol</button>
            </article>`).join("");
    }

    renderizarOperadores() {
        const op = JSON.parse(localStorage.getItem("operadores")) || [];
        document.getElementById("lista-operadores").innerHTML = op.map(o => `
            <article style="display:grid; grid-template-columns:2fr 1fr 1fr; padding:10px; border-bottom:1px solid var(--border-color); align-items: center;">
                <span style="font-weight:bold;">${o.nombre}</span><span>${o.siglas}</span>
                <button class="btn-borrar-operador" data-id="${o.operadorId}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar 🗑️</button>
            </article>`).join("");
    }

    renderizarPuntos() {
        const pt = JSON.parse(localStorage.getItem("puntos")) || [];
        document.getElementById("lista-puntos").innerHTML = pt.map(p => `
            <article style="display:grid; grid-template-columns:1fr 2fr 1fr; padding:10px; border-bottom:1px solid var(--border-color); align-items: center;">
                <span style="font-weight:bold;">${p.tipo}</span><span>${p.codigo}</span>
                <button class="btn-borrar-punto" data-id="${p.puntoId}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar 🗑️</button>
            </article>`).join("");
    }
}