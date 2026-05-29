import { TableroView } from "../views/TableroView.js";
import { normalizarIdColumna } from "../utils/helpers.js";
import { ApiService } from "../data/ApiService.js"; 

export class TableroController {
    constructor(tableroViewInstance = null, inputBusquedaOverride = null) {
        this.tableroView = tableroViewInstance || new TableroView();
        this.columnaActivaID = "FECHA-HORA"; 
        this.ordenAscendente = true;
        
        this.inputBusqueda = inputBusquedaOverride || document.getElementById("busqueda-codigo");

        this.initListeners();
    }

    initListeners() {
        if (this.inputBusqueda) {
            const busquedaGuardada = sessionStorage.getItem("memoriaBusqueda");
            if (busquedaGuardada) this.inputBusqueda.value = busquedaGuardada;
            this.inputBusqueda.addEventListener("input", (e) => {
                sessionStorage.setItem("memoriaBusqueda", e.target.value);
                this.aplicarFiltros();
            });
        }

        const btnFiltro = document.getElementById("btn-filtro-estado");
        const dropdownFiltro = document.getElementById("dropdown-filtro-estado");
        const checkboxes = document.querySelectorAll(".chk-estado");

        if (btnFiltro && dropdownFiltro) {
            btnFiltro.addEventListener("click", (e) => {
                e.stopPropagation();
                dropdownFiltro.classList.toggle("hidden");
            });

            document.addEventListener("click", (e) => {
                if (!e.target.closest("#custom-filter-container")) {
                    dropdownFiltro.classList.add("hidden");
                }
            });

            let estadoGuardado = ["TODOS"];
            try {
                const memoria = sessionStorage.getItem("memoriaEstado");
                if (memoria) estadoGuardado = JSON.parse(memoria);
            } catch (e) {}

            checkboxes.forEach(chk => {
                chk.checked = estadoGuardado.includes(chk.value);
                
                chk.addEventListener("change", (e) => {
                    if (e.target.value === "TODOS" && e.target.checked) {
                        checkboxes.forEach(c => { if(c.value !== "TODOS") c.checked = false; });
                    } else if (e.target.value !== "TODOS" && e.target.checked) {
                        const chkTodos = document.querySelector('.chk-estado[value="TODOS"]');
                        if (chkTodos) chkTodos.checked = false;
                    }

                    let seleccionados = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
                    if (seleccionados.length === 0) {
                        seleccionados = ["TODOS"];
                        const chkTodos = document.querySelector('.chk-estado[value="TODOS"]');
                        if(chkTodos) chkTodos.checked = true;
                    }

                    btnFiltro.innerText = seleccionados.includes("TODOS") 
                        ? "Estados: Todos ▼" 
                        : `Estados: ${seleccionados.length} selec. ▼`;

                    sessionStorage.setItem("memoriaEstado", JSON.stringify(seleccionados));
                    this.aplicarFiltros();
                });
            });

            const iniciales = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
            btnFiltro.innerText = iniciales.includes("TODOS") ? "Estados: Todos ▼" : `Estados: ${iniciales.length} selec. ▼`;
        }

        document.querySelectorAll(".panel").forEach(panel => {
            const btnExpandir = panel.querySelector(".btn-expandir-tabla");
            if (btnExpandir) {
                btnExpandir.addEventListener("click", () => {
                    const estaExpandida = panel.classList.toggle("tabla-expandida");
                    btnExpandir.title = estaExpandida ? "Contraer tabla" : "Ver más detalles";
                    if (!estaExpandida) {
                        const cuerpoTabla = panel.querySelector('.tabla-cuerpo.cuerpo-reciente');
                        if(cuerpoTabla) cuerpoTabla.scrollLeft = 0; 
                    }
                });
            }
        });

        document.querySelector(".tableros-container")?.addEventListener("click", (e) => this.handleTableClicks(e));

        const modalDetalle = document.getElementById("modal-detalle");
        document.getElementById("close-modal-detalle")?.addEventListener("click", () => modalDetalle?.classList.add("hidden"));
        modalDetalle?.addEventListener("click", (e) => { if (e.target.id === "modal-detalle") modalDetalle.classList.add("hidden"); });
    }

    async cargarDatosDelServidor() {
        try {
            const [dataOperaciones, dataOperadores, dataPuntos] = await Promise.all([
                ApiService.getOperaciones(),
                ApiService.getOperadores(),
                ApiService.getPuntos()
            ]);

            this.datosMemoria = {
                operaciones: dataOperaciones,
                operadores: dataOperadores,
                puntos: dataPuntos
            };

            this.aplicarFiltros();

        } catch (error) {
            console.error("🔥 Error crítico cargando el tablero:", error);
            const msgError = `<div style="padding: 20px; color: #ff4d4d; text-align: center; font-weight: bold;">❌ Error de conexión: ${error.message}</div>`;
            document.getElementById("lista-salidas").innerHTML = msgError;
            document.getElementById("lista-llegadas").innerHTML = msgError;
        }
    }

    aplicarFiltros() {
        if (!this.datosMemoria) {
            this.cargarDatosDelServidor();
            return;
        }

        const { operaciones, operadores, puntos } = this.datosMemoria;
        const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo")); 
        
        const busqueda = this.inputBusqueda ? this.inputBusqueda.value.trim().toLowerCase() : "";
        
        const checkBoxes = document.querySelectorAll(".chk-estado:checked");
        const estadosSeleccionados = checkBoxes.length ? Array.from(checkBoxes).map(c => c.value) : ["TODOS"];
        const mostrarTodos = estadosSeleccionados.includes("TODOS");

        const filtradas = operaciones.filter(op => {
            const opReal = op.operacion || op.operation || op; // 🕵️‍♂️ TRADUCTOR AÑADIDO
            const codigo = (opReal.codigo || opReal.code || "").toLowerCase();
            const estado = (opReal.estado || opReal.status || "").toUpperCase();

            const coincideBusqueda = codigo.includes(busqueda);
            const coincideEstado = mostrarTodos || estadosSeleccionados.includes(estado);
            
            return coincideBusqueda && coincideEstado;
        });

        const salidas = this.ordenarOperaciones(filtradas.filter(op => {
            const opReal = op.operacion || op.operation || op; // 🕵️‍♂️ TRADUCTOR AÑADIDO
            return (opReal.sentido || opReal.direction || "").toLowerCase() === "salida";
        }), operadores, puntos);
        
        const llegadas = this.ordenarOperaciones(filtradas.filter(op => {
            const opReal = op.operacion || op.operation || op; // 🕵️‍♂️ TRADUCTOR AÑADIDO
            return (opReal.sentido || opReal.direction || "").toLowerCase() === "llegada";
        }), operadores, puntos);

        this.tableroView.render(salidas, llegadas, operadores, puntos, usuarioActivo);
        this.renderizarInterfazAdministracion(usuarioActivo);
    }

    ordenarOperaciones(lista, operadores, puntos) {
        return lista.sort((a, b) => {
            const aReal = a.operacion || a.operation || a; 
            const bReal = b.operacion || b.operation || b; 

            let vA, vB;
            switch (normalizarIdColumna(this.columnaActivaID)) {
                case "FECHA-HORA":
                case "HORA": 
                    vA = new Date(aReal.horaProgramada || aReal.scheduled_time || 0).getTime(); 
                    vB = new Date(bReal.horaProgramada || bReal.scheduled_time || 0).getTime(); 
                    break;
                case "CODIGO": 
                    vA = (aReal.codigo || aReal.code || "").toLowerCase(); 
                    vB = (bReal.codigo || bReal.code || "").toLowerCase(); 
                    break;
                case "DESTINO":
                case "ORIGEN": 
                    const sentidoA = aReal.sentido || aReal.direction;
                    const sentidoB = bReal.sentido || bReal.direction;
                    vA = (sentidoA === "salida" ? (aReal.destino || aReal.destination) : (aReal.origen || aReal.origin) || "").toLowerCase(); 
                    vB = (sentidoB === "salida" ? (bReal.destino || bReal.destination) : (bReal.origen || bReal.origin) || "").toLowerCase(); 
                    break;
                case "OPERADOR": 
                    // 🕵️‍♂️ TRADUCTOR ANIDADO (Busca si el operador viene como ID suelta o como objeto {id: 1})
                    const idOpA = aReal.operadorId || aReal.operator_id || aReal.operador?.id || aReal.operator?.id;
                    const idOpB = bReal.operadorId || bReal.operator_id || bReal.operador?.id || bReal.operator?.id;
                    const opA = operadores.find(o => { const oReal = o.operador || o.operator || o; return String(oReal.id) === String(idOpA); });
                    const opB = operadores.find(o => { const oReal = o.operador || o.operator || o; return String(oReal.id) === String(idOpB); });
                    vA = ((opA?.operador || opA?.operator || opA)?.nombre || (opA?.operador || opA?.operator || opA)?.name || "").toLowerCase(); 
                    vB = ((opB?.operador || opB?.operator || opB)?.nombre || (opB?.operador || opB?.operator || opB)?.name || "").toLowerCase(); 
                    break;
                case "PUERTA/VIA": 
                    const idPtoA = aReal.puntoId || aReal.spot_id || aReal.punto?.puntoId || aReal.punto?.id || aReal.spot?.id;
                    const idPtoB = bReal.puntoId || bReal.spot_id || bReal.punto?.puntoId || bReal.punto?.id || bReal.spot?.id;
                    const ptoA = puntos.find(p => { const pReal = p.punto || p.spot || p.point || p; return String(pReal.puntoId || pReal.id) === String(idPtoA); });
                    const ptoB = puntos.find(p => { const pReal = p.punto || p.spot || p.point || p; return String(pReal.puntoId || pReal.id) === String(idPtoB); });
                    vA = ((ptoA?.punto || ptoA?.spot || ptoA?.point || ptoA)?.codigo || (ptoA?.punto || ptoA?.spot || ptoA?.point || ptoA)?.code || "").toLowerCase(); 
                    vB = ((ptoB?.punto || ptoB?.spot || ptoB?.point || ptoB)?.codigo || (ptoB?.punto || ptoB?.spot || ptoB?.point || ptoB)?.code || "").toLowerCase(); 
                    break;
                case "ESTADO": 
                    vA = (aReal.estado || aReal.status || "").toLowerCase(); 
                    vB = (bReal.estado || bReal.status || "").toLowerCase(); 
                    break;
                default: return 0;
            }
            if (vA < vB) return this.ordenAscendente ? -1 : 1;
            if (vA > vB) return this.ordenAscendente ? 1 : -1;
            return 0;
        });
    }

    handleTableClicks(e) {
        if (e.target.closest(".toggle-historico")) return this.toggleAcordeonHistorial(e.target.closest(".toggle-historico"));
        
        const cabeceraClicada = e.target.closest(".tabla-header span") || (e.target.parentElement?.classList.contains("tabla-header") ? e.target : null);
        if (cabeceraClicada) return this.gestionarOrdenacionColumna(cabeceraClicada);

        const filaClicada = e.target.closest(".operacion-row");
        if (filaClicada && !e.target.closest(".acciones-gestor")) this.mostrarDetalleOperacion(filaClicada.getAttribute("data-id"));
    }

    toggleAcordeonHistorial(toggleBtn) {
        const targetId = toggleBtn.getAttribute("data-target");
        const targetDiv = document.getElementById(targetId);
        targetDiv.classList.toggle("hidden");
        
        const estaAhoraAbierto = !targetDiv.classList.contains("hidden");
        localStorage.setItem(`estado-${targetId}`, estaAhoraAbierto);
        
        toggleBtn.firstElementChild.innerText = estaAhoraAbierto ? "▲" : "▼";
        toggleBtn.lastElementChild.innerText = estaAhoraAbierto ? "▲" : "▼";
    }

    gestionarOrdenacionColumna(cabeceraClicada) {
        const idColumnaClicada = normalizarIdColumna(cabeceraClicada.innerText || cabeceraClicada.textContent || "");
        if (idColumnaClicada === "ACCIONES" || !idColumnaClicada) return; 

        if (normalizarIdColumna(this.columnaActivaID) === idColumnaClicada) {
            this.ordenAscendente = !this.ordenAscendente; 
        } else {
            this.columnaActivaID = idColumnaClicada; 
            this.ordenAscendente = true;
        }

        document.querySelectorAll(".tabla-header span").forEach(span => {
            const idIterada = normalizarIdColumna(span.innerText || span.textContent || "");
            const textoLimpio = (span.innerText || span.textContent || "").replace(/[⬆️⬇️]/g, "").trim();
            span.innerText = textoLimpio + (idIterada === idColumnaClicada ? (this.ordenAscendente ? " ⬆️" : " ⬇️") : "");
        });

        this.aplicarFiltros();
    }

    mostrarDetalleOperacion(id) {
        if (!this.datosMemoria) return;

        const opRaw = this.datosMemoria.operaciones.find(o => {
            const oReal = o.operacion || o.operation || o; 
            return String(oReal.id || oReal.operacionId) === String(id);
        });
        if (!opRaw) return;
        
        const op = opRaw.operacion || opRaw.operation || opRaw;

        const idOperador = op.operadorId || op.operator_id || op.operador?.id || op.operator?.id;
        const operadorRaw = this.datosMemoria.operadores.find(o => {
            const oReal = o.operador || o.operator || o;
            return String(oReal.id) === String(idOperador);
        });
        const operador = operadorRaw ? (operadorRaw.operador || operadorRaw.operator || operadorRaw) : null;

        const idPunto = op.puntoId || op.spot_id || op.punto?.puntoId || op.punto?.id || op.spot?.id;
        const puntoRaw = this.datosMemoria.puntos.find(p => {
            const pReal = p.punto || p.spot || p.point || p;
            return String(pReal.id || pReal.puntoId) === String(idPunto);
        });
        const punto = puntoRaw ? (puntoRaw.punto || puntoRaw.spot || puntoRaw.point || puntoRaw) : null;
        
        document.getElementById("titulo-detalle").innerText = `${(op.tipo || "").toLowerCase() === "tren" ? "🚂" : "✈️"} Detalles de la Operación`;
        document.getElementById("detalle-contenido").innerHTML = /*html*/ `
            <p>🏷️ <strong>Código:</strong> ${op.codigo || op.code || 'N/A'}</p>
            <p>🚏 <strong>Tipo:</strong> ${(op.tipo || op.type || 'N/A').toUpperCase()}</p>
            <p>🗺️ <strong>Trayecto:</strong> ${op.origen || op.origin || 'N/A'} ➡️ ${op.destino || op.destination || 'N/A'}</p>
            <p>🏢 <strong>Operador:</strong> ${operador ? (operador.nombre || operador.name) : 'N/A'}</p>
            <p>🚪 <strong>Puerta/Vía:</strong> ${punto ? (punto.codigo || punto.code) : 'N/A'}</p>
            <p>🕒 <strong>Hora Programada:</strong> ${new Date(op.horaProgramada || op.scheduled_time || 0).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
            <p>⏳ <strong>Hora Estimada:</strong> ${new Date(op.horaEstimada || op.estimated_time || 0).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
            <p>🚦 <strong>Estado:</strong> <span class="estado-tag state-${(op.estado || op.status || '').toLowerCase()}">${op.estado || op.status}</span></p>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid var(--border-color);">
            <p style="font-size:0.8rem; color:gray;">🔑 <strong>ID Interno:</strong> ${op.id || op.operacionId}</p>
        `;
        document.getElementById("modal-detalle")?.classList.remove("hidden");
    }

    renderizarInterfazAdministracion(usuarioActual) {
        const contenedorAuth = document.querySelector(".auth-buttons");
        let infoUsuarioLogueado = document.getElementById("info-usuario-activo");

        if (usuarioActual) {
            if (!infoUsuarioLogueado) {
                infoUsuarioLogueado = document.createElement("div");
                infoUsuarioLogueado.id = "info-usuario-activo";
                infoUsuarioLogueado.style.cssText = "display:flex; align-items:center; gap:10px; padding:6px 16px; border-radius:20px; background-color:var(--panel-bg); border:1px solid var(--border-color); box-shadow:0 2px 5px var(--shadow-color); margin-right:15px;";
                contenedorAuth.prepend(infoUsuarioLogueado);
            }
            const esGestor = usuarioActual.rol === "GESTOR";
            infoUsuarioLogueado.innerHTML = `
                <span style="font-size: 1.1rem;">${esGestor ? "👨‍✈️" : "👤"}</span>
                <span style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">${usuarioActual.email.split('@')[0]}</span>
                <span style="background-color: ${esGestor ? "var(--status-green)" : "var(--accent-blue)"}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: bold;">${usuarioActual.rol}</span>
            `;
        } else if (infoUsuarioLogueado) infoUsuarioLogueado.remove();
    }
}