import { generarULID, ICONO_POR_DEFECTO } from "../utils/helpers.js";
import { ApiService } from "../data/ApiService.js"; 

const ROL_GESTOR = "GESTOR";
const ROL_PUBLICO = "PÚBLICO";

export class AdminController {
    constructor(onDataChangedCallback) {
        this.onDataChanged = onDataChangedCallback;
        this.initListeners();
    }

    initListeners() {
        ["close-modal-op", "close-modal-crear", "close-modal-usuarios", "close-modal-operadores", "close-modal-puntos"].forEach(id => {
            document.getElementById(id)?.addEventListener("click", (e) => e.target.closest('.modal-overlay').classList.add("hidden"));
        });

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

        const selectTipoCrear = document.getElementById("crear-tipo");
        if (selectTipoCrear) selectTipoCrear.addEventListener("change", (e) => this.actualizarDesplegablePuntos(e.target.value));

        const selectSentidoCrear = document.getElementById("crear-sentido");
        if (selectSentidoCrear) {
            selectSentidoCrear.addEventListener("change", (e) => {
                const inputCiudad = document.getElementById("crear-ciudad");
                const labelCiudad = document.querySelector('label[for="crear-ciudad"]') || (inputCiudad ? inputCiudad.previousElementSibling : null);
                if (labelCiudad) labelCiudad.innerText = e.target.value === "llegada" ? "Origen" : "Destino";
            });
        }
    }

    async actualizarDesplegablePuntos(tipoSeleccionado) {
        const selectPunto = document.getElementById("crear-punto");
        if (selectPunto) selectPunto.innerHTML = "<option>⏳ Cargando...</option>";

        const todosLosPuntos = await ApiService.getPuntos(); 
        const esVuelo = tipoSeleccionado.toLowerCase().includes("vuelo");
        
        const puntosFiltrados = todosLosPuntos.filter(p => {
            // 🕵️‍♂️ TRADUCTOR: Buscamos "punto", "spot", o "point"
            const pReal = p.punto || p.spot || p.point || p;
            return (pReal.tipo || pReal.type || "").toLowerCase() === (esVuelo ? "puerta" : "via");
        });
        
        if (selectPunto) {
            selectPunto.innerHTML = puntosFiltrados.map(p => {
                const pReal = p.punto || p.spot || p.point || p;
                return `<option value="${pReal.id || pReal.puntoId}">${pReal.codigo || pReal.code}</option>`;
            }).join("");
            const labelPunto = document.querySelector('label[for="crear-punto"]') || selectPunto.previousElementSibling;
            if (labelPunto) labelPunto.innerText = esVuelo ? "Puerta" : "Vía";
        }
    }

    handleGlobalClicks(e) {
        if (e.target.closest(".btn-editar") || e.target.closest(".btn-borrar")) this.handleAccionesOperacionDOM(e);
        else if (e.target.closest("#btn-nueva-operacion") || e.target.closest("#btn-gestionar-usuarios") || e.target.closest("#btn-gestionar-operadores") || e.target.closest("#btn-gestionar-puntos")) this.handleAperturaModales(e);
        else if (e.target.closest(".btn-cambiar-rol")) this.handleCambiarRol(e);
        else if (e.target.closest(".btn-borrar-operador") || e.target.closest(".btn-borrar-punto")) this.handleBorrarCatalogos(e);
    }

    // 🌐 ABRIR MODAL DE EDICIÓN O BORRAR DIRECTAMENTE
    async handleAccionesOperacionDOM(e) {
        const btnEditar = e.target.closest(".btn-editar");
        if (btnEditar) {
            const idTarget = btnEditar.getAttribute("data-id");
            
            // Descargamos listas reales
            const [operaciones, operadores, puntos] = await Promise.all([
                ApiService.getOperaciones(), ApiService.getOperadores(), ApiService.getPuntos()
            ]);

            // Buscamos la operación real usando el traductor
            const opRaw = operaciones.find(o => {
                const oReal = o.operation || o.operacion || o;
                return String(oReal.id || oReal.operacionId) === String(idTarget);
            });

            if (opRaw) {
                const op = opRaw.operation || opRaw.operacion || opRaw;

                document.getElementById("op-id").value = op.id || op.operacionId;
                document.getElementById("op-estado").value = (op.estado || op.status || "PROGRAMADO").toUpperCase();
                
                document.getElementById("op-operador").innerHTML = operadores.map(o => {
                    const oReal = o.operator || o.operador || o;
                    const selected = String(oReal.id) === String(op.operadorId || op.operator_id) ? 'selected' : '';
                    return `<option value="${oReal.id}" ${selected}>${oReal.nombre || oReal.name}</option>`;
                }).join("");
                
                document.getElementById("op-punto").innerHTML = puntos.map(p => {
                    const pReal = p.spot || p.punto || p.point || p;
                    const selected = String(pReal.id) === String(op.puntoId || op.spot_id) ? 'selected' : '';
                    return `<option value="${pReal.id}" ${selected}>${pReal.codigo || pReal.code}</option>`;
                }).join("");
                
                document.getElementById("modal-operacion")?.classList.remove("hidden");
            }
            return;
        }

        const btnBorrar = e.target.closest(".btn-borrar");
        if (btnBorrar && confirm("⚠️ ¿Deseas borrar definitivamente esta operación?")) {
            try {
                const id = btnBorrar.getAttribute("data-id");
                btnBorrar.innerText = "⏳";
                await ApiService.deleteOperacion(id);
                this.onDataChanged();
            } catch (error) {
                alert("❌ Error al borrar: " + error.message);
                this.onDataChanged();
            }
        }
    }

    async handleAperturaModales(e) {
        if (e.target.closest("#btn-nueva-operacion")) {
            document.getElementById("modal-crear")?.classList.remove("hidden");
            document.getElementById("crear-operador").innerHTML = "<option>⏳ Cargando...</option>";
            
            const operadores = await ApiService.getOperadores();
            document.getElementById("crear-operador").innerHTML = operadores.map(o => {
                // 🕵️‍♂️ TRADUCTOR: Buscamos "operador", "operator", o directamente "o"
                const oReal = o.operador || o.operator || o; 
                return `<option value="${oReal.id || oReal.operadorId}">${oReal.nombre || oReal.name}</option>`;
            }).join("");
            
            this.actualizarDesplegablePuntos(document.getElementById("crear-tipo")?.value || "");
            
            const selectSentido = document.getElementById("crear-sentido");
            const labelCiudad = document.querySelector('label[for="crear-ciudad"]') || document.getElementById("crear-ciudad")?.previousElementSibling;
            if (selectSentido && labelCiudad) labelCiudad.innerText = selectSentido.value === "llegada" ? "Origen" : "Destino";
        }
        else if (e.target.closest("#btn-gestionar-usuarios")) { 
            document.getElementById("modal-usuarios")?.classList.remove("hidden");
            this.renderizarUsuarios(); 
        }
        else if (e.target.closest("#btn-gestionar-operadores")) { 
            document.getElementById("modal-operadores")?.classList.remove("hidden");
            this.renderizarOperadores(); 
        }
        else if (e.target.closest("#btn-gestionar-puntos")) { 
            document.getElementById("modal-puntos")?.classList.remove("hidden");
            this.renderizarPuntos(); 
        }
    }

    async handleCambiarRol(e) {
        const btnRol = e.target.closest(".btn-cambiar-rol");
        const userId = btnRol.getAttribute("data-id");
        const nuevoRol = btnRol.getAttribute("data-rol") === "GESTOR" ? ["GESTOR"] : ["PUBLICO"]; 

        try {
            btnRol.disabled = true;
            btnRol.innerText = "Cargando...";

            await ApiService.updateRolUser(userId, nuevoRol); 
            this.renderizarUsuarios();
            
        } catch (error) {
            alert("Error al cambiar el rol: " + error.message);
            btnRol.disabled = false;
            btnRol.innerText = "Cambiar Rol";
        }
    }

    async handleBorrarCatalogos(e) {
        try {
            if (e.target.closest(".btn-borrar-operador")) {
                const btn = e.target.closest(".btn-borrar-operador");
                const id = btn.getAttribute("data-id");
                btn.innerText = "Borrando..."; 
                
                await ApiService.deleteOperador(id);
                this.renderizarOperadores(); 
                this.onDataChanged();
                
            } else if (e.target.closest(".btn-borrar-punto")) {
                const btn = e.target.closest(".btn-borrar-punto");
                const id = btn.getAttribute("data-id");
                btn.innerText = "Borrando...";
                
                await ApiService.deletePunto(id);
                this.renderizarPuntos(); 
                this.onDataChanged();
            }
        } catch (error) {
            alert("Error al borrar: " + error.message);
            this.renderizarOperadores();
            this.renderizarPuntos();
        }
    }

    // 🌐 CREAR OPERACIÓN (Vuelo/Tren)
    async handleCrearOperacion(e) { 
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerText = "⏳...";
        btn.disabled = true;

        try {
            // Transformamos la fecha a formato ISO (el que pide Swagger)
            const horaIso = new Date(document.getElementById("crear-hora").value).toISOString();
            const sentido = document.getElementById("crear-sentido").value;
            const ciudad = document.getElementById("crear-ciudad").value;

            const nuevaOperacion = {
                tipo: document.getElementById("crear-tipo").value,
                codigo: document.getElementById("crear-codigo").value,
                sentido: sentido,
                origen: sentido === "llegada" ? ciudad : "Madrid",
                destino: sentido === "salida" ? ciudad : "Madrid",
                horaProgramada: horaIso,
                horaEstimada: horaIso,
                estado: "programado", // Swagger lo pide en minúsculas
                operadorId: parseInt(document.getElementById("crear-operador").value),
                puntoId: parseInt(document.getElementById("crear-punto").value)
            };

            await ApiService.createOperacion(nuevaOperacion);
            
            e.target.reset(); 
            document.getElementById("modal-crear").classList.add("hidden");
            this.onDataChanged(); // Esto le dice al tablero que recargue la lista
            
        } catch (error) {
            alert("❌ Error al crear operación: " + error.message);
        } finally {
            btn.innerText = "Crear Operación";
            btn.disabled = false;
        }
    }

    // 🌐 GUARDAR EDICIÓN (Cambiar estado, operador o punto)
    async handleEditarOperacion(e) { 
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerText = "⏳...";
        btn.disabled = true;

        try {
            const id = document.getElementById("op-id").value;
            const datosActualizados = {
                estado: document.getElementById("op-estado").value.toLowerCase(),
                operadorId: parseInt(document.getElementById("op-operador").value),
                puntoId: parseInt(document.getElementById("op-punto").value)
            };

            await ApiService.updateOperacion(id, datosActualizados);
            
            document.getElementById("modal-operacion").classList.add("hidden");
            this.onDataChanged(); 
            
        } catch (error) {
            alert("❌ Error al editar: " + error.message);
        } finally {
            btn.innerText = "Guardar Cambios";
            btn.disabled = false;
        }
    }

    // 🌐 CREAR CATÁLOGOS
    async handleCrearOperador(e) { 
        e.preventDefault();
        try {
            const nuevoOperador = { 
                nombre: document.getElementById("nuevo-op-nombre").value, 
                siglas: document.getElementById("nuevo-op-siglas").value.toUpperCase().substring(0, 6), // Swagger dice máx 6 caracteres
                color: "azul",
                urlIcono: "https://miw.etsisi.upm.es/wp-content/uploads/2021/04/miw.png" // 🚀 URL real requerida por el Backend
            };
            
            await ApiService.createOperador(nuevoOperador);
            e.target.reset(); 
            this.renderizarOperadores(); 
            this.onDataChanged(); 
        } catch (error) {
            alert("Error al crear operador: " + error.message);
        }
    }

    async handleCrearPunto(e) { 
        e.preventDefault();
        try {
            const nuevoPunto = { 
                tipo: document.getElementById("nuevo-pto-tipo").value, 
                codigo: document.getElementById("nuevo-pto-codigo").value.toUpperCase() 
            };
            
            await ApiService.createPunto(nuevoPunto);
            e.target.reset(); 
            this.renderizarPuntos(); 
            this.onDataChanged();
        } catch (error) {
            alert("❌ Error al crear punto: " + error.message);
        }
    }
    // ------------------------------------------------------------------

    // 🌐 LEER USUARIOS USANDO EL SERVICIO
    async renderizarUsuarios() { 
        const contenedor = document.getElementById("lista-usuarios");
        contenedor.innerHTML = "<p style='padding: 15px;'>⏳ Cargando usuarios...</p>";

        try {
            const lista = await ApiService.getUsers(); 

            contenedor.innerHTML = lista.map(item => {
                // 🕵️‍♂️ TRADUCTOR: Buscamos "usuario" o "user"
                const u = item.usuario || item.user || item; 
                const email = u.email || u.username || "Sin Email";
                const rolTexto = JSON.stringify(u).toLowerCase();
                const esGestor = rolTexto.includes('gestor');

                return `
                <article class="modal-list-row" style="grid-template-columns: 2fr 1fr 1.5fr;">
                    <span style="font-weight:bold;">${email}</span>
                    <span style="color:${esGestor ? '#2ecc71' : '#95a5a6'}; font-size:0.8rem; font-weight:bold;">
                        ${esGestor ? 'GESTOR' : 'PÚBLICO'}
                    </span>
                    <button class="btn-cambiar-rol" data-id="${u.id || u.userId}" data-rol="${esGestor ? 'PUBLICO' : 'GESTOR'}" style="background:#3498db; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">
                        Cambiar Rol
                    </button>
                </article>`;
            }).join("");

        } catch (error) {
            contenedor.innerHTML = `<p style="color:red; padding:15px;">❌ Error: ${error.message}</p>`;
        }
    }

    // 🌐 LEER OPERADORES
    async renderizarOperadores() { 
        const op = await ApiService.getOperadores(); 
        
        document.getElementById("lista-operadores").innerHTML = op.map(item => {
            const oReal = item.operador || item.operator || item; // Buscamos en español también
            return `
            <article class="modal-list-row" style="grid-template-columns: 2fr 1fr 1fr;">
                <span style="font-weight:bold;">${oReal.nombre || oReal.name || "Sin nombre"}</span>
                <span>${oReal.siglas || oReal.code || ""}</span>
                <button class="btn-borrar-operador" data-id="${oReal.id || oReal.operadorId}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar</button>
            </article>`;
        }).join("");
    }

    // 🌐 LEER PUNTOS
    async renderizarPuntos() { 
        const pt = await ApiService.getPuntos(); 
        
        document.getElementById("lista-puntos").innerHTML = pt.map(item => {
            const pReal = item.punto || item.spot || item.point || item; // Buscamos en español también
            return `
            <article class="modal-list-row" style="grid-template-columns: 1fr 2fr 1fr;">
                <span style="font-weight:bold;">${pReal.tipo || pReal.type || ""}</span>
                <span>${pReal.codigo || pReal.code || ""}</span>
                <button class="btn-borrar-punto" data-id="${pReal.puntoId || pReal.id}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar</button>
            </article>`;
        }).join("");
    }
}