import { TableroView } from "../views/TableroView.js";
import { normalizarIdColumna } from "../utils/helpers.js";

const ROL_GESTOR = "GESTOR";

export class TableroController {
    // Añadimos parámetros por defecto al constructor para Inyección de Dependencias
    constructor(
        tableroViewInstance = null, 
        inputBusquedaOverride = null, 
        selectEstadoOverride = null
    ) {
        // Si no le pasamos vista (producción), crea la real. Si le pasamos una (testing), usa la simulada.
        this.tableroView = tableroViewInstance || new TableroView();
        this.columnaActivaID = "FECHA-HORA"; 
        this.ordenAscendente = true;
        
        // Prioriza los elementos pasados por parámetro (para el test), si no, usa el DOM real
        this.inputBusqueda = inputBusquedaOverride || document.getElementById("busqueda-codigo");
        this.selectEstado = selectEstadoOverride || document.getElementById("filtro-estado");

        this.initListeners();
    }

    initListeners() {
        if(this.inputBusqueda) this.inputBusqueda.addEventListener("input", () => this.aplicarFiltros());
        if(this.selectEstado) this.selectEstado.addEventListener("change", () => this.aplicarFiltros());

        const tablerosContenedorGlobal = document.querySelector(".tableros-container");
        if(tablerosContenedorGlobal) {
            tablerosContenedorGlobal.addEventListener("click", (eventoClic) => this.handleTableClicks(eventoClic));
        }

        // Usamos optional chaining robusto para no romper el test si el modal no existe
        const btnClose = document.getElementById("close-modal-detalle");
        if (btnClose) {
            btnClose.addEventListener("click", () => document.getElementById("modal-detalle")?.classList.add("hidden"));
        }
    }

    aplicarFiltros() {
        const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
        const operaciones = JSON.parse(localStorage.getItem("operaciones")) || [];
        const operadores = JSON.parse(localStorage.getItem("operadores")) || [];
        const puntos = JSON.parse(localStorage.getItem("puntos")) || [];
        
        const busqueda = this.inputBusqueda.value.trim().toLowerCase();
        const estado = this.selectEstado.value;

        const filtradas = operaciones.filter(op => {
            return op.codigo.toLowerCase().includes(busqueda) && (estado === "TODOS" || op.estado === estado);
        });

        let salidas = filtradas.filter(op => op.sentido === "salida");
        let llegadas = filtradas.filter(op => op.sentido === "llegada");

        const ordenarLista = (lista) => {
            return lista.sort((a, b) => {
                let vA, vB;
                const idColumna = normalizarIdColumna(this.columnaActivaID);

                switch (idColumna) {
                    case "FECHA-HORA":
                    case "HORA":
                        vA = new Date(Number(a.horaProgramada) || a.horaProgramada).getTime();
                        vB = new Date(Number(b.horaProgramada) || b.horaProgramada).getTime();
                        break;
                    case "CODIGO":
                        vA = a.codigo.toLowerCase(); vB = b.codigo.toLowerCase();
                        break;
                    case "DESTINO":
                    case "ORIGEN":
                        vA = (a.sentido === "salida" ? a.destino : a.origen).toLowerCase();
                        vB = (b.sentido === "salida" ? b.destino : b.origen).toLowerCase();
                        break;
                    case "OPERADOR":
                        vA = (operadores.find(o => o.operadorId === a.operadorId)?.nombre || "").toLowerCase();
                        vB = (operadores.find(o => o.operadorId === b.operadorId)?.nombre || "").toLowerCase();
                        break;
                    case "PUERTA/VIA":
                        vA = (puntos.find(p => p.puntoId === a.puntoId)?.codigo || "").toLowerCase();
                        vB = (puntos.find(p => p.puntoId === b.puntoId)?.codigo || "").toLowerCase();
                        break;
                    case "ESTADO":
                        vA = a.estado.toLowerCase(); vB = b.estado.toLowerCase();
                        break;
                    default: return 0;
                }

                if (vA < vB) return this.ordenAscendente ? -1 : 1;
                if (vA > vB) return this.ordenAscendente ? 1 : -1;
                return 0;
            });
        };

        this.tableroView.render(ordenarLista(salidas), ordenarLista(llegadas), operadores, puntos, usuarioActivo);
        this.renderizarInterfazAdministracion(usuarioActivo);
    }

    handleTableClicks(eventoClic) {
        // 1. Buscamos la cabecera (usamos textContent como salvavidas para el test)
        const cabeceraClicada = eventoClic.target.closest(".tabla-header span") || 
                               (eventoClic.target.parentElement?.classList.contains("tabla-header") ? eventoClic.target : null);
        
        if (cabeceraClicada) {
            const textoRaw = cabeceraClicada.innerText || cabeceraClicada.textContent || "";
            const idColumnaClicada = normalizarIdColumna(textoRaw);
            
            if (idColumnaClicada === "ACCIONES" || !idColumnaClicada) return; 

            if (normalizarIdColumna(this.columnaActivaID) === idColumnaClicada) {
                this.ordenAscendente = !this.ordenAscendente; 
            } else {
                this.columnaActivaID = idColumnaClicada; 
                this.ordenAscendente = true;
            }

            // Actualizamos visualmente las flechitas
            document.querySelectorAll(".tabla-header span").forEach(cabeceraSpan => {
                const txt = cabeceraSpan.innerText || cabeceraSpan.textContent || "";
                const idIterada = normalizarIdColumna(txt);
                const textoLimpio = txt.replace(/[⬆️⬇️]/g, "").trim();
                
                if (idIterada === idColumnaClicada) {
                    cabeceraSpan.innerText = textoLimpio + (this.ordenAscendente ? " ⬆️" : " ⬇️");
                } else {
                    cabeceraSpan.innerText = textoLimpio;
                }
            });

            this.aplicarFiltros();
            return;
        }

        // Mostrar Detalle
        const filaTablaClicada = eventoClic.target.closest(".operacion-row");
        if (filaTablaClicada && !eventoClic.target.closest(".acciones-gestor")) { 
            const idOperacion = filaTablaClicada.getAttribute("data-id");
            this.mostrarDetalleOperacion(idOperacion);
        }
    }

    mostrarDetalleOperacion(id) {
        const operaciones = JSON.parse(localStorage.getItem("operaciones")) || [];
        const op = operaciones.find(o => o.operacionId === id);
        if (!op) return;

        const operador = (JSON.parse(localStorage.getItem("operadores")) || []).find(o => o.operadorId === op.operadorId);
        const punto = (JSON.parse(localStorage.getItem("puntos")) || []).find(p => p.puntoId === op.puntoId);
        
        const fechaHoraProgramada = new Date(op.horaProgramada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        const fechaHoraEstimada = new Date(op.horaEstimada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        const emojiTipo = op.tipo.toLowerCase() === "tren" ? "🚂" : "✈️";
        
        const tituloModal = document.getElementById("titulo-detalle");
        if(tituloModal) tituloModal.innerText = `${emojiTipo} Detalles de la Operación`;

        document.getElementById("detalle-contenido").innerHTML = `
            <p>🏷️ <strong>Código:</strong> ${op.codigo}</p>
            <p>🚏 <strong>Tipo:</strong> ${op.tipo.toUpperCase()}</p>
            <p>🗺️ <strong>Trayecto:</strong> ${op.origen} ➡️ ${op.destino}</p>
            <p>🏢 <strong>Operador:</strong> ${operador ? operador.nombre : 'N/A'}</p>
            <p>🚪 <strong>Puerta/Vía:</strong> ${punto ? punto.codigo : 'N/A'}</p>
            <p>🕒 <strong>Hora Programada:</strong> ${fechaHoraProgramada}</p>
            <p>⏳ <strong>Hora Estimada:</strong> ${fechaHoraEstimada}</p>
            <p>🚦 <strong>Estado:</strong> <span class="estado-tag state-${op.estado.toLowerCase()}">${op.estado}</span></p>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid var(--border-color);">
            <p style="font-size:0.8rem; color:gray;">🔑 <strong>ULID Interno:</strong> ${op.operacionId}</p>
        `;
        document.getElementById("modal-detalle")?.classList.remove("hidden");
    }

    renderizarInterfazAdministracion(usuarioActual) {
        const contenedorFiltros = document.querySelector(".filtros");
        const contenedorAuth = document.querySelector(".auth-buttons");
        let infoUsuarioLogueado = document.getElementById("info-usuario-activo");

        if (usuarioActual) {
            if (!infoUsuarioLogueado) {
                infoUsuarioLogueado = document.createElement("span");
                infoUsuarioLogueado.id = "info-usuario-activo";
                infoUsuarioLogueado.style.color = "white";
                infoUsuarioLogueado.style.marginRight = "15px";
                infoUsuarioLogueado.style.alignSelf = "center";
                contenedorAuth.prepend(infoUsuarioLogueado);
            }
            const colorDistintivoRol = usuarioActual.rol === ROL_GESTOR ? "#2ecc71" : "#3498db";
            infoUsuarioLogueado.innerHTML = `👤 ${usuarioActual.email} <strong style="color: ${colorDistintivoRol}; margin-left: 5px;">[${usuarioActual.rol}]</strong>`;
        } else if (infoUsuarioLogueado) {
            infoUsuarioLogueado.remove();
        }

        const alternarBotonAdmin = (id, mostrar, texto, clase, color) => {
            let btn = document.getElementById(id);
            if (mostrar && !btn) {
                btn = document.createElement("button");
                btn.id = id; btn.className = clase; btn.style.marginLeft = "10px";
                if(color) btn.style.backgroundColor = color;
                btn.innerText = texto;
                if(contenedorFiltros) contenedorFiltros.appendChild(btn);
            } else if (!mostrar && btn) btn.remove();
        };

        const esGestor = usuarioActual && usuarioActual.rol === ROL_GESTOR;
        alternarBotonAdmin("btn-nueva-operacion", esGestor, "➕ Nueva Operación", "btn-primary", "#2ecc71");
        alternarBotonAdmin("btn-gestionar-usuarios", esGestor, "👥 Usuarios", "btn-secondary");
        alternarBotonAdmin("btn-gestionar-operadores", esGestor, "🏢 Operadores", "btn-secondary");
        alternarBotonAdmin("btn-gestionar-puntos", esGestor, "🚪 Puntos", "btn-secondary");
    }
}