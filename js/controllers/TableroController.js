import { TableroView } from "../views/TableroView.js";
import { normalizarIdColumna } from "../utils/helpers.js";

const ROL_GESTOR = "GESTOR";

export class TableroController {
    constructor(
        tableroViewInstance = null, 
        inputBusquedaOverride = null, 
        selectEstadoOverride = null
    ) {
        this.tableroView = tableroViewInstance || new TableroView();
        this.columnaActivaID = "FECHA-HORA"; 
        this.ordenAscendente = true;
        
        this.inputBusqueda = inputBusquedaOverride || document.getElementById("busqueda-codigo");
        this.selectEstado = selectEstadoOverride || document.getElementById("filtro-estado");

        this.initListeners();
    }

    initListeners() {
        // ==========================================
        // 💾 1. MEMORIA PARA LA BÚSQUEDA Y EL FILTRO
        // ==========================================
        if (this.inputBusqueda) {
            // A. Si había algo guardado de antes (por un F5), lo volvemos a poner en la caja
            const busquedaGuardada = sessionStorage.getItem("memoriaBusqueda");
            if (busquedaGuardada) {
                this.inputBusqueda.value = busquedaGuardada;
            }

            // B. Cada vez que el usuario escriba una letra, la guardamos en secreto
            this.inputBusqueda.addEventListener("input", (e) => {
                sessionStorage.setItem("memoriaBusqueda", e.target.value);
                this.aplicarFiltros();
            });
        }

        if (this.selectEstado) {
            // Hacemos exactamente el mismo truco para el desplegable de Estados
            const estadoGuardado = sessionStorage.getItem("memoriaEstado");
            if (estadoGuardado) {
                this.selectEstado.value = estadoGuardado;
            }

            this.selectEstado.addEventListener("change", (e) => {
                sessionStorage.setItem("memoriaEstado", e.target.value);
                this.aplicarFiltros();
            });
        }

        // ==========================================
        // ➡️ 2. EVENTO PARA EXPANDIR TABLAS EN MÓVIL
        // ==========================================
        const tableros = document.querySelectorAll(".panel");
        tableros.forEach(panel => {
            const btnExpandir = panel.querySelector(".btn-expandir-tabla");
            if (btnExpandir) {
                btnExpandir.addEventListener("click", () => {
                    const estaExpandida = panel.classList.toggle("tabla-expandida");
                    
                    // Cambiamos la flecha visualmente (> o <)
                    if (estaExpandida) {
                        btnExpandir.innerHTML = "&#10094;"; // Flecha apuntando a la izquierda <
                        btnExpandir.title = "Contraer tabla";
                    } else {
                        btnExpandir.innerHTML = "&#10095;"; // Flecha apuntando a la derecha >
                        btnExpandir.title = "Ver más detalles";
                        // Devolvemos el scroll al principio para que no se quede glitcheado
                        const cuerpoTabla = panel.querySelector('.tabla-cuerpo.cuerpo-reciente');
                        if(cuerpoTabla) cuerpoTabla.scrollLeft = 0; 
                    }
                });
            }
        });
        // ==========================================

        const tablerosContenedorGlobal = document.querySelector(".tableros-container");
        if(tablerosContenedorGlobal) {
            tablerosContenedorGlobal.addEventListener("click", (eventoClic) => this.handleTableClicks(eventoClic));
        }

        // ==========================================
        // ❌ CIERRE DEL MODAL DE DETALLES
        // ==========================================
        const modalDetalle = document.getElementById("modal-detalle");
        const btnClose = document.getElementById("close-modal-detalle");

        // 1. Cierre con la 'X'
        if (btnClose) {
            btnClose.addEventListener("click", () => modalDetalle?.classList.add("hidden"));
        }

        // 2. Cierre haciendo clic en el fondo oscuro (overlay)
        if (modalDetalle) {
            modalDetalle.addEventListener("click", (e) => {
                if (e.target.id === "modal-detalle") {
                    modalDetalle.classList.add("hidden");
                }
            });
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
        // 1. Mostrar/Ocultar Historial (Acordeón y Memoria Local)
        const toggleBtn = eventoClic.target.closest(".toggle-historico");
        if (toggleBtn) {
            const targetId = toggleBtn.getAttribute("data-target");
            const targetDiv = document.getElementById(targetId);
            
            // Alternamos la clase oculta
            targetDiv.classList.toggle("hidden");
            
            // 💾 GUARDAR ESTADO: Si NO tiene la clase 'hidden', está abierto (true)
            const estaAhoraAbierto = !targetDiv.classList.contains("hidden");
            localStorage.setItem(`estado-${targetId}`, estaAhoraAbierto);
            
            // Animamos las flechitas minimalistas en los extremos de forma segura
            toggleBtn.firstElementChild.innerText = estaAhoraAbierto ? "▲" : "▼";
            toggleBtn.lastElementChild.innerText = estaAhoraAbierto ? "▲" : "▼";
            return;
        }

        // 2. Ordenación por cabeceras
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

        // 3. Mostrar Detalle de la Operación
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
        const contenedorAuth = document.querySelector(".auth-buttons");
        let infoUsuarioLogueado = document.getElementById("info-usuario-activo");

        if (usuarioActual) {
            if (!infoUsuarioLogueado) {
                infoUsuarioLogueado = document.createElement("div");
                infoUsuarioLogueado.id = "info-usuario-activo";
                
                infoUsuarioLogueado.style.display = "flex";
                infoUsuarioLogueado.style.alignItems = "center";
                infoUsuarioLogueado.style.gap = "10px";
                infoUsuarioLogueado.style.padding = "6px 16px";
                infoUsuarioLogueado.style.borderRadius = "20px";
                infoUsuarioLogueado.style.backgroundColor = "var(--panel-bg)";
                infoUsuarioLogueado.style.border = "1px solid var(--border-color)";
                infoUsuarioLogueado.style.boxShadow = "0 2px 5px var(--shadow-color)";
                infoUsuarioLogueado.style.marginRight = "15px";
                
                contenedorAuth.prepend(infoUsuarioLogueado);
            }

            const esGestor = usuarioActual.rol === "GESTOR";
            const colorRol = esGestor ? "var(--status-green)" : "var(--accent-blue)";
            const iconoRol = esGestor ? "👨‍✈️" : "👤";

            infoUsuarioLogueado.innerHTML = `
                <span style="font-size: 1.1rem;">${iconoRol}</span>
                <span style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">
                    ${usuarioActual.email.split('@')[0]} 
                </span>
                <span style="background-color: ${colorRol}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: bold; letter-spacing: 0.5px;">
                    ${usuarioActual.rol}
                </span>
            `;
        } else if (infoUsuarioLogueado) {
            infoUsuarioLogueado.remove();
        }
    }
}