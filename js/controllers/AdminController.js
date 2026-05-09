import { generarULID, ICONO_POR_DEFECTO } from "../utils/helpers.js";

const ROL_GESTOR = "GESTOR";
const ROL_PUBLICO = "PÚBLICO";

export class AdminController {
    constructor(onDataChangedCallback) {
        this.onDataChanged = onDataChangedCallback;
        this.initListeners();
    }

    initListeners() {
        // Cierre de modales con la "X"
        ["close-modal-op", "close-modal-crear", "close-modal-usuarios", "close-modal-operadores", "close-modal-puntos"].forEach(id => {
            document.getElementById(id)?.addEventListener("click", (e) => e.target.closest('.modal-overlay').classList.add("hidden"));
        });

        // ✅ Cierre de modales al hacer clic en el fondo oscuro
        ["modal-operacion", "modal-crear", "modal-usuarios", "modal-operadores", "modal-puntos"].forEach(id => {
            document.getElementById(id)?.addEventListener("click", (e) => {
                if (e.target.id === id) e.target.classList.add("hidden");
            });
        });

        document.getElementById("form-operacion")?.addEventListener("submit", (e) => this.handleEditarOperacion(e));
        document.getElementById("form-crear")?.addEventListener("submit", (e) => this.handleCrearOperacion(e));
        document.getElementById("form-add-operador")?.addEventListener("submit", (e) => this.handleCrearOperador(e));
        document.getElementById("form-add-punto")?.addEventListener("submit", (e) => this.handleCrearPunto(e));

        document.body.addEventListener("click", (e) => this.handleGlobalClicks(e));

        // 🔄 Escuchar cambios en el selector de Tipo (Select Dependiente)
        const selectTipoCrear = document.getElementById("crear-tipo");
        if (selectTipoCrear) {
            selectTipoCrear.addEventListener("change", (e) => {
                this.actualizarDesplegablePuntos(e.target.value);
            });
        }
    }

    // ==========================================
    // 🔄 LÓGICA DE SELECTS DEPENDIENTES
    // ==========================================
    actualizarDesplegablePuntos(tipoSeleccionado) {
        const todosLosPuntos = JSON.parse(localStorage.getItem("puntos")) || [];
        const esVuelo = tipoSeleccionado.toLowerCase().includes("vuelo");
        const tipoBuscado = esVuelo ? "puerta" : "via";

        // 1. Filtrar las opciones del desplegable
        const puntosFiltrados = todosLosPuntos.filter(p => p.tipo.toLowerCase() === tipoBuscado);
        const selectPunto = document.getElementById("crear-punto");
        
        if (selectPunto) {
            selectPunto.innerHTML = puntosFiltrados.map(p => 
                `<option value="${p.puntoId}">${p.codigo}</option>`
            ).join("");

            // 2. ✨ NUEVO: Cambiar el texto del título (label) dinámicamente
            // Buscamos la etiqueta que está vinculada a este select
            const labelPunto = document.querySelector('label[for="crear-punto"]') || selectPunto.previousElementSibling;
            if (labelPunto) {
                labelPunto.innerText = esVuelo ? "Puerta" : "Vía";
            }
        }
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

        const btnBorrarOp = e.target.closest(".btn-borrar");
        if (btnBorrarOp) {
            if (confirm("⚠️ ¿Deseas borrar definitivamente esta operación?")) {
                let ops = JSON.parse(localStorage.getItem("operaciones")) || [];
                localStorage.setItem("operaciones", JSON.stringify(ops.filter(o => o.operacionId !== btnBorrarOp.getAttribute("data-id"))));
                this.onDataChanged();
            }
            return;
        }

        // Apertura Modal NUEVA OPERACIÓN
        if (e.target.closest("#btn-nueva-operacion")) {
            // 1. Cargamos Operadores
            const op = JSON.parse(localStorage.getItem("operadores")) || [];
            document.getElementById("crear-operador").innerHTML = op.map(o => `<option value="${o.operadorId}">${o.nombre}</option>`).join("");
            
            // 2. Cargamos los Puntos (Filtrados por lo que esté seleccionado por defecto)
            const tipoInicial = document.getElementById("crear-tipo").value;
            this.actualizarDesplegablePuntos(tipoInicial);
            
            // 3. Mostramos el modal
            document.getElementById("modal-crear")?.classList.remove("hidden");
        }
        
        if (e.target.closest("#btn-gestionar-usuarios")) { this.renderizarUsuarios(); document.getElementById("modal-usuarios")?.classList.remove("hidden"); }
        if (e.target.closest("#btn-gestionar-operadores")) { this.renderizarOperadores(); document.getElementById("modal-operadores")?.classList.remove("hidden"); }
        if (e.target.closest("#btn-gestionar-puntos")) { this.renderizarPuntos(); document.getElementById("modal-puntos")?.classList.remove("hidden"); }

        const btnRol = e.target.closest(".btn-cambiar-rol");
        if (btnRol) {
            const email = btnRol.getAttribute("data-email");
            const nuevoRol = btnRol.getAttribute("data-rol");
            let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
            if (nuevoRol === ROL_PUBLICO && usuarios.filter(u => u.rol === ROL_GESTOR).length <= 1) return alert("⚠️ ALERTA DE SISTEMA: No puedes degradar al último Gestor disponible.");
            const idx = usuarios.findIndex(u => u.email === email);
            usuarios[idx].rol = nuevoRol;
            localStorage.setItem("usuarios", JSON.stringify(usuarios));
            if (JSON.parse(sessionStorage.getItem("usuarioActivo"))?.email === email) location.reload();
            else { this.renderizarUsuarios(); this.onDataChanged(); }
        }

        const bOperador = e.target.closest(".btn-borrar-operador");
        if (bOperador) {
            const id = parseInt(bOperador.getAttribute("data-id"));
            let op = JSON.parse(localStorage.getItem("operadores")) || [];
            localStorage.setItem("operadores", JSON.stringify(op.filter(o => o.operadorId !== id)));
            this.renderizarOperadores(); this.onDataChanged();
        }
        
        const bPunto = e.target.closest(".btn-borrar-punto");
        if (bPunto) {
            const id = parseInt(bPunto.getAttribute("data-id"));
            let pt = JSON.parse(localStorage.getItem("puntos")) || [];
            localStorage.setItem("puntos", JSON.stringify(pt.filter(p => p.puntoId !== id)));
            this.renderizarPuntos(); this.onDataChanged();
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
            operacionId: generarULID(), tipo: document.getElementById("crear-tipo").value,
            codigo: document.getElementById("crear-codigo").value, sentido,
            origen: sentido === "llegada" ? ciudad : "Madrid", destino: sentido === "salida" ? ciudad : "Madrid",
            horaProgramada: hora, horaEstimada: hora, estado: "PROGRAMADO",
            operadorId: parseInt(document.getElementById("crear-operador").value),
            puntoId: parseInt(document.getElementById("crear-punto").value)
        });
        localStorage.setItem("operaciones", JSON.stringify(ops));
        e.target.reset(); document.getElementById("modal-crear").classList.add("hidden");
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
            operadorId: Date.now(), nombre: document.getElementById("nuevo-op-nombre").value, 
            siglas: document.getElementById("nuevo-op-siglas").value.toUpperCase(), urlIcono: ICONO_POR_DEFECTO 
        });
        localStorage.setItem("operadores", JSON.stringify(op));
        e.target.reset(); this.renderizarOperadores(); this.onDataChanged();
    }

    handleCrearPunto(e) {
        e.preventDefault();
        let pt = JSON.parse(localStorage.getItem("puntos")) || [];
        pt.push({ 
            puntoId: Date.now(), tipo: document.getElementById("nuevo-pto-tipo").value, 
            codigo: document.getElementById("nuevo-pto-codigo").value.toUpperCase() 
        });
        localStorage.setItem("puntos", JSON.stringify(pt));
        e.target.reset(); this.renderizarPuntos(); this.onDataChanged();
    }

    renderizarUsuarios() {
        const usu = JSON.parse(localStorage.getItem("usuarios")) || [];
        document.getElementById("lista-usuarios").innerHTML = usu.map(u => `
            <article class="modal-list-row" style="grid-template-columns: 2fr 1fr 1.5fr;">
                <span style="font-weight:bold;">${u.email}</span>
                <span style="color:${u.rol === ROL_GESTOR ? '#2ecc71' : '#95a5a6'}; font-size:0.8rem; font-weight:bold;">${u.rol}</span>
                <button class="btn-cambiar-rol" data-email="${u.email}" data-rol="${u.rol === ROL_GESTOR ? ROL_PUBLICO : ROL_GESTOR}" style="background:#3498db; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Cambiar Rol</button>
            </article>`).join("");
    }

    renderizarOperadores() {
        const op = JSON.parse(localStorage.getItem("operadores")) || [];
        document.getElementById("lista-operadores").innerHTML = op.map(o => `
            <article class="modal-list-row" style="grid-template-columns: 2fr 1fr 1fr;">
                <span style="font-weight:bold;">${o.nombre}</span><span>${o.siglas}</span>
                <button class="btn-borrar-operador" data-id="${o.operadorId}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar 🗑️</button>
            </article>`).join("");
    }

    renderizarPuntos() {
        const pt = JSON.parse(localStorage.getItem("puntos")) || [];
        document.getElementById("lista-puntos").innerHTML = pt.map(p => `
            <article class="modal-list-row" style="grid-template-columns: 1fr 2fr 1fr;">
                <span style="font-weight:bold;">${p.tipo}</span><span>${p.codigo}</span>
                <button class="btn-borrar-punto" data-id="${p.puntoId}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar 🗑️</button>
            </article>`).join("");
    }
}