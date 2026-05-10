import { TableroView } from "../views/TableroView.js";
import { normalizarIdColumna } from "../utils/helpers.js";

export class TableroController {
    constructor(tableroViewInstance = null, inputBusquedaOverride = null, selectEstadoOverride = null) {
        this.tableroView = tableroViewInstance || new TableroView();
        this.columnaActivaID = "FECHA-HORA"; 
        this.ordenAscendente = true;
        
        this.inputBusqueda = inputBusquedaOverride || document.getElementById("busqueda-codigo");
        this.selectEstado = selectEstadoOverride || document.getElementById("filtro-estado");

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

        if (this.selectEstado) {
            const estadoGuardado = sessionStorage.getItem("memoriaEstado");
            if (estadoGuardado) this.selectEstado.value = estadoGuardado;
            this.selectEstado.addEventListener("change", (e) => {
                sessionStorage.setItem("memoriaEstado", e.target.value);
                this.aplicarFiltros();
            });
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

    aplicarFiltros() {
        const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
        const operaciones = JSON.parse(localStorage.getItem("operaciones")) || [];
        const operadores = JSON.parse(localStorage.getItem("operadores")) || [];
        const puntos = JSON.parse(localStorage.getItem("puntos")) || [];
        
        const busqueda = this.inputBusqueda.value.trim().toLowerCase();
        const estado = this.selectEstado.value;

        const filtradas = operaciones.filter(op => op.codigo.toLowerCase().includes(busqueda) && (estado === "TODOS" || op.estado === estado));

        const salidas = this.ordenarOperaciones(filtradas.filter(op => op.sentido === "salida"), operadores, puntos);
        const llegadas = this.ordenarOperaciones(filtradas.filter(op => op.sentido === "llegada"), operadores, puntos);

        this.tableroView.render(salidas, llegadas, operadores, puntos, usuarioActivo);
        this.renderizarInterfazAdministracion(usuarioActivo);
    }

    // ✨ Refactor: Lógica de ordenación aislada
    ordenarOperaciones(lista, operadores, puntos) {
        return lista.sort((a, b) => {
            let vA, vB;
            switch (normalizarIdColumna(this.columnaActivaID)) {
                case "FECHA-HORA":
                case "HORA": vA = new Date(Number(a.horaProgramada) || a.horaProgramada).getTime(); vB = new Date(Number(b.horaProgramada) || b.horaProgramada).getTime(); break;
                case "CODIGO": vA = a.codigo.toLowerCase(); vB = b.codigo.toLowerCase(); break;
                case "DESTINO":
                case "ORIGEN": vA = (a.sentido === "salida" ? a.destino : a.origen).toLowerCase(); vB = (b.sentido === "salida" ? b.destino : b.origen).toLowerCase(); break;
                case "OPERADOR": vA = (operadores.find(o => o.operadorId === a.operadorId)?.nombre || "").toLowerCase(); vB = (operadores.find(o => o.operadorId === b.operadorId)?.nombre || "").toLowerCase(); break;
                case "PUERTA/VIA": vA = (puntos.find(p => p.puntoId === a.puntoId)?.codigo || "").toLowerCase(); vB = (puntos.find(p => p.puntoId === b.puntoId)?.codigo || "").toLowerCase(); break;
                case "ESTADO": vA = a.estado.toLowerCase(); vB = b.estado.toLowerCase(); break;
                default: return 0;
            }
            if (vA < vB) return this.ordenAscendente ? -1 : 1;
            if (vA > vB) return this.ordenAscendente ? 1 : -1;
            return 0;
        });
    }

    // ✨ Refactor: Router de clics más limpio
    handleTableClicks(e) {
        if (e.target.closest(".toggle-historico")) return this.toggleAcordeonHistorial(e.target.closest(".toggle-historico"));
        
        const cabeceraClicada = e.target.closest(".tabla-header span") || (e.target.parentElement?.classList.contains("tabla-header") ? e.target : null);
        if (cabeceraClicada) return this.gestionarOrdenacionColumna(cabeceraClicada);

        const filaClicada = e.target.closest(".operacion-row");
        if (filaClicada && !e.target.closest(".acciones-gestor")) this.mostrarDetalleOperacion(filaClicada.getAttribute("data-id"));
    }

    // --- Sub-métodos aislados ---
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
    // --- Fin Sub-métodos ---

    mostrarDetalleOperacion(id) { /* ... (Sin cambios) ... */
        const op = (JSON.parse(localStorage.getItem("operaciones")) || []).find(o => o.operacionId === id);
        if (!op) return;

        const operador = (JSON.parse(localStorage.getItem("operadores")) || []).find(o => o.operadorId === op.operadorId);
        const punto = (JSON.parse(localStorage.getItem("puntos")) || []).find(p => p.puntoId === op.puntoId);
        
        document.getElementById("titulo-detalle").innerText = `${op.tipo.toLowerCase() === "tren" ? "🚂" : "✈️"} Detalles de la Operación`;
        /* HTML*/
        document.getElementById("detalle-contenido").innerHTML = `
            <p>🏷️ <strong>Código:</strong> ${op.codigo}</p>
            <p>🚏 <strong>Tipo:</strong> ${op.tipo.toUpperCase()}</p>
            <p>🗺️ <strong>Trayecto:</strong> ${op.origen} ➡️ ${op.destino}</p>
            <p>🏢 <strong>Operador:</strong> ${operador ? operador.nombre : 'N/A'}</p>
            <p>🚪 <strong>Puerta/Vía:</strong> ${punto ? punto.codigo : 'N/A'}</p>
            <p>🕒 <strong>Hora Programada:</strong> ${new Date(op.horaProgramada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
            <p>⏳ <strong>Hora Estimada:</strong> ${new Date(op.horaEstimada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
            <p>🚦 <strong>Estado:</strong> <span class="estado-tag state-${op.estado.toLowerCase()}">${op.estado}</span></p>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid var(--border-color);">
            <p style="font-size:0.8rem; color:gray;">🔑 <strong>ULID Interno:</strong> ${op.operacionId}</p>
        `;
        document.getElementById("modal-detalle")?.classList.remove("hidden");
    }

    renderizarInterfazAdministracion(usuarioActual) { /* ... (Sin cambios) ... */
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