import { TableroView } from "../views/TableroView.js";
import { normalizarIdColumna } from "../utils/helpers.js";

const ROL_GESTOR = "GESTOR";

export class TableroController {
    constructor() {
        this.tableroView = new TableroView();
        this.columnaActivaID = "FECHA-HORA"; 
        this.ordenAscendente = true;
        
        this.inputBusqueda = document.getElementById("busqueda-codigo");
        this.selectEstado = document.getElementById("filtro-estado");

        this.initListeners();
    }

    initListeners() {
        if(this.inputBusqueda) this.inputBusqueda.addEventListener("input", () => this.aplicarFiltros());
        if(this.selectEstado) this.selectEstado.addEventListener("change", () => this.aplicarFiltros());

        const tablerosContenedorGlobal = document.querySelector(".tableros-container");
        if(tablerosContenedorGlobal) {
            tablerosContenedorGlobal.addEventListener("click", (eventoClic) => this.handleTableClicks(eventoClic));
        }

        document.getElementById("close-modal-detalle")?.addEventListener("click", () => document.getElementById("modal-detalle").classList.add("hidden"));
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
        // Ordenación por cabeceras
        const cabeceraClicada = eventoClic.target.closest(".tabla-header span") || (eventoClic.target.parentElement?.classList.contains("tabla-header") ? eventoClic.target : null);
        if (cabeceraClicada) {
            const idColumnaClicada = normalizarIdColumna(cabeceraClicada.innerText);
            if (idColumnaClicada === "ACCIONES") return; 

            if (normalizarIdColumna(this.columnaActivaID) === idColumnaClicada) {
                this.ordenAscendente = !this.ordenAscendente; 
            } else {
                this.columnaActivaID = idColumnaClicada; 
                this.ordenAscendente = true;
            }

            document.querySelectorAll(".tabla-header span").forEach(cabeceraSpan => {
                const idCabeceraIterada = normalizarIdColumna(cabeceraSpan.innerText);
                const textoBaseLimpio = cabeceraSpan.innerText.replace(/[⬆️⬇️]/g, "").trim();
                if (idCabeceraIterada === idColumnaClicada) {
                    cabeceraSpan.innerText = textoBaseLimpio + (this.ordenAscendente ? " ⬆️" : " ⬇️");
                } else {
                    cabeceraSpan.innerText = textoBaseLimpio;
                }
            });
            this.aplicarFiltros();
            return;
        }

        // Mostrar Detalle (Ignora clics en los botones de gestor)
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