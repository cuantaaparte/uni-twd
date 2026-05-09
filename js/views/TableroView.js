export class TableroView {
    constructor() {
        this.listaSalidas = document.getElementById("lista-salidas");
        this.listaLlegadas = document.getElementById("lista-llegadas");
        this.panelSalidas = document.getElementById("panel-salidas");
        this.panelLlegadas = document.getElementById("panel-llegadas");
    }

    render(salidas, llegadas, operadores, puntos, usuarioActivo = null) {
        const esGestor = usuarioActivo && usuarioActivo.rol === "GESTOR";

        [this.panelSalidas, this.panelLlegadas].forEach(panel => 
            esGestor ? panel.classList.add("modo-gestor") : panel.classList.remove("modo-gestor")
        );

        const limite24h = Date.now() - (24 * 60 * 60 * 1000);

        // 🛠️ TRUCO JS: Forzamos que la hora SIEMPRE sea un número
        const obtenerTiempo = (hora) => new Date(Number(hora) || hora).getTime();

        const generarHTMLBloque = (operaciones) => {
            return operaciones.map(op => {
                const opEncontrado = operadores.find(o => o.operadorId === op.operadorId);
                const ptEncontrado = puntos.find(p => p.puntoId === op.puntoId);
                return this.generarFilaHTML(op, opEncontrado, ptEncontrado, esGestor);
            }).join("");
        };

        const renderizarPanel = (operaciones, contenedorTarget, idToggle) => {
            const historicas = operaciones.filter(op => obtenerTiempo(op.horaProgramada) < limite24h);
            const recientes = operaciones.filter(op => obtenerTiempo(op.horaProgramada) >= limite24h);

            // 🔍 Recuperamos el estado guardado (abierto o cerrado tras F5)
            const estaAbierto = localStorage.getItem(`estado-${idToggle}`) === "true";
            const claseHidden = estaAbierto ? "" : "hidden";
            const iconoFlecha = estaAbierto ? "▲" : "▼";

            let html = "";
            /* html */
            // 1. Bloque Reciente (AHORA VA PRIMERO 🥇)
            html += `<div class="tabla-cuerpo cuerpo-reciente">${generarHTMLBloque(recientes)}</div>`;

            /* html */
            // 2. Barra Desplegable Minimalista (EN MEDIO 🍔)
            html += `<div class="toggle-historico" data-target="${idToggle}">
                        <span>${iconoFlecha}</span> 
                        <span style="font-size:0.85rem; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Historial (Hace más de 24h)</span> 
                        <span>${iconoFlecha}</span>
                    </div>`;

            /* html */
            // 3. Bloque Histórico (AHORA VA AL FINAL ⏬)
            html += `<div id="${idToggle}" class="${claseHidden}">`;
            if (historicas.length === 0) {
                /* html */
                html += `<div style="padding: 15px; text-align: center; color: var(--text-muted, gray); font-style: italic; border-bottom: 2px solid var(--border-color);">
                            Ninguna operación de hace más de 24h
                        </div>`;
            } else {
                /* html */
                html += `<div class="tabla-cuerpo cuerpo-historico">${generarHTMLBloque(historicas)}</div>`;
            }
            html += `</div>`;

            contenedorTarget.innerHTML = html;
        };


        renderizarPanel(salidas, this.listaSalidas, "hist-salidas");
        renderizarPanel(llegadas, this.listaLlegadas, "hist-llegadas");
    }

    generarFilaHTML(operacion, operador, punto, esGestor) {
        const fechaOperacion = new Date(Number(operacion.horaProgramada) || operacion.horaProgramada);
        
        // Comprobar si la fecha es pasada
        const timestampOperacion = fechaOperacion.getTime();
        const esPasada = timestampOperacion < Date.now();
        const estiloColorFecha = esPasada ? "color: #ff4d4d; font-weight: bold;" : ""; 
        
        // Tiempos relativos
        const fechaHoy = new Date();
        fechaHoy.setHours(0, 0, 0, 0);
        
        const fechaManana = new Date(fechaHoy);
        fechaManana.setDate(fechaManana.getDate() + 1);

        const fechaAyer = new Date(fechaHoy);
        fechaAyer.setDate(fechaAyer.getDate() - 1);
        
        const diaOperacion = new Date(fechaOperacion);
        diaOperacion.setHours(0, 0, 0, 0);

        let textoFechaHora = "";
        const formatoSoloHora = fechaOperacion.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const formatoSoloFecha = fechaOperacion.toLocaleDateString();

        if (diaOperacion.getTime() === fechaHoy.getTime()) {
            textoFechaHora = formatoSoloHora; 
        } else if (diaOperacion.getTime() === fechaManana.getTime()) {
            textoFechaHora = `M-${formatoSoloHora}`; 
        } else if (diaOperacion.getTime() === fechaAyer.getTime()) {
            textoFechaHora = `A-${formatoSoloHora}`; 
        } else {
            textoFechaHora = formatoSoloFecha; 
        }

        // Iconos y datos
        const urlIcono = operador ? operador.urlIcono : "🟧";
        const siglasOperador = operador ? operador.siglas : "N/A";
        
        const esImagen = urlIcono && (urlIcono.startsWith("http") || urlIcono.includes("/") || urlIcono.includes("."));

        const htmlIcono = esImagen
            ? `<img src="${urlIcono}" alt="${siglasOperador}" width="20" style="margin-right: 5px; vertical-align: middle;">`
            : `<span style="font-size: 1.2rem; margin-right: 5px; vertical-align: middle;">${urlIcono}</span>`;

        const ciudadDestinoOrigen = operacion.sentido === "salida" ? operacion.destino : operacion.origen;
        const nombreOperador = operador ? operador.nombre : "Desconocido";

        let htmlAccionesAdmin = "";
        if (esGestor) {
            /* html */
            htmlAccionesAdmin = `
                <nav class="acciones-gestor">
                    <button class="btn-icon btn-editar" data-id="${operacion.operacionId}" title="Editar">✏️</button>
                    <button class="btn-icon btn-borrar" data-id="${operacion.operacionId}" title="Borrar">🗑️</button>
                </nav>
            `;
        }

        /* html */
        return `
            <article class="operacion-row" data-id="${operacion.operacionId}">
                <span style="${estiloColorFecha}">${textoFechaHora}</span>
                <span style="font-weight: bold; color: var(--accent-blue, #0f3460);">${operacion.codigo}</span>
                <span>${ciudadDestinoOrigen}</span>
                <span class="operador-info">
                    ${htmlIcono} 
                    ${nombreOperador}
                </span>
                <span>${punto ? punto.codigo : "---"}</span>
                <span class="estado-tag state-${operacion.estado.toLowerCase()}">${operacion.estado}</span>
                ${htmlAccionesAdmin} 
            </article>
        `;
    }
}