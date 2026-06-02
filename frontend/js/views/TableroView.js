export class TableroView {
    constructor() {
        this.listaSalidas = document.getElementById("lista-salidas");
        this.listaLlegadas = document.getElementById("lista-llegadas");
        this.panelSalidas = document.getElementById("panel-salidas");
        this.panelLlegadas = document.getElementById("panel-llegadas");
    }

    render(salidas, llegadas, operadores, puntos, usuarioActivo = null) {
        const esGestor = usuarioActivo && usuarioActivo.rol === "GESTOR";

        [this.panelSalidas, this.panelLlegadas].forEach(panel => {
            if (panel) {
                esGestor ? panel.classList.add("modo-gestor") : panel.classList.remove("modo-gestor");
            }
        });

        if (this.listaSalidas) this.#renderizarPanel(salidas, this.listaSalidas, "hist-salidas", operadores, puntos, esGestor);
        if (this.listaLlegadas) this.#renderizarPanel(llegadas, this.listaLlegadas, "hist-llegadas", operadores, puntos, esGestor);
    }

    #renderizarPanel(operaciones, contenedor, idToggle, operadores, puntos, esGestor) {
        const limite24h = Date.now() - (24 * 60 * 60 * 1000);
        const historicas = operaciones.filter(op => (new Date(Number(op.horaProgramada) || op.horaProgramada).getTime()) < limite24h);
        const recientes = operaciones.filter(op => (new Date(Number(op.horaProgramada) || op.horaProgramada).getTime()) >= limite24h);

        const estaAbierto = localStorage.getItem(`estado-${idToggle}`) === "true";
        const iconoFlecha = estaAbierto ? "▲" : "▼";

        let html = "";
        
        html += `<div class="tabla-cuerpo cuerpo-reciente">${this.#generarBloqueFilas(recientes, operadores, puntos, esGestor)}</div>`;
        
        html += `
            <div class="toggle-historico" data-target="${idToggle}">
                <span>${iconoFlecha}</span> 
                <span style="font-size:0.85rem; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Historial (Hace más de 24h)</span> 
                <span>${iconoFlecha}</span>
            </div>`;

        html += `<div id="${idToggle}" class="${estaAbierto ? "" : "hidden"}">`;
        if (historicas.length === 0) {
            html += `<div style="padding: 15px; text-align: center; color: var(--text-muted, gray); font-style: italic; border-bottom: 2px solid var(--border-color);">Ninguna operación de hace más de 24h</div>`;
        } else {
            html += `<div class="tabla-cuerpo cuerpo-historico">${this.#generarBloqueFilas(historicas, operadores, puntos, esGestor)}</div>`;
        }
        html += `</div>`;

        contenedor.innerHTML = html;
    }

    #generarBloqueFilas(operaciones, operadores, puntos, esGestor) {
        return operaciones.map(op => {
            // 🛡️ BÚSQUEDA A PRUEBA DE BOMBAS (Strings + Respaldo de Docker)
            // 1. Buscamos en la lista global convirtiendo ambos a texto puro
            let opEncontrado = operadores.find(o => String(o.id) === String(op.operadorId));
            // 2. Si no lo pilla, miramos si el backend nos mandó el objeto anidado dentro de la operación
            if (!opEncontrado && op.operador) opEncontrado = op.operador;

            let ptEncontrado = puntos.find(p => String(p.id) === String(op.puntoId));
            if (!ptEncontrado && op.punto) ptEncontrado = op.punto;

            return this.generarFilaHTML(op, opEncontrado, ptEncontrado, esGestor);
        }).join("");
    }

    generarFilaHTML(operacion, operador, punto, esGestor) {
        const { textoFechaHora, esPasada } = this.#formatearFechaRelativa(operacion.horaProgramada);
        const estiloColorFecha = esPasada ? "color: #ff4d4d; font-weight: bold;" : ""; 
        const htmlIcono = this.#obtenerIconoOperador(operador);
        
        const ciudadDestinoOrigen = operacion.sentido === "salida" ? operacion.destino : operacion.origen;
        
        // 🔍 Extracción segura: intentamos leer todas las posibles traducciones del backend
        const nombreOperador = operador ? (operador.nombre || operador.name || "Desconocido") : "Desconocido";
        const codigoPunto = punto ? (punto.codigo || punto.code || punto.name || "---") : "---";

        return `
            <article class="operacion-row" data-id="${operacion.operacionId || operacion.id}">
                <span style="${estiloColorFecha}">${textoFechaHora}</span>
                <span style="font-weight: bold; color: var(--accent-blue, #0f3460);">${operacion.codigo}</span>
                <span>${ciudadDestinoOrigen}</span>
                <span class="operador-info">${htmlIcono} ${nombreOperador}</span>
                <span>${codigoPunto}</span>
                <span class="estado-tag state-${(operacion.estado || "").toLowerCase()}">${operacion.estado}</span>
                ${this.#getAccionesGestor(esGestor, operacion.operacionId || operacion.id)} 
            </article>
        `;
    }

    // --- MÉTODOS AUXILIARES PRIVADOS DE FORMATEO ---

    #formatearFechaRelativa(horaMilisegundos) {
        const fecha = new Date(Number(horaMilisegundos) || horaMilisegundos);
        const esPasada = fecha.getTime() < Date.now();
        
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);
        const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
        
        const diaOp = new Date(fecha); diaOp.setHours(0, 0, 0, 0);

        const horaTexto = fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        
        let textoFinal = "";
        if (diaOp.getTime() === hoy.getTime()) textoFinal = horaTexto; 
        else if (diaOp.getTime() === manana.getTime()) textoFinal = `M-${horaTexto}`; 
        else if (diaOp.getTime() === ayer.getTime()) textoFinal = `A-${horaTexto}`; 
        else textoFinal = fecha.toLocaleDateString();

        return { textoFechaHora: textoFinal, esPasada };
    }

    #obtenerIconoOperador(operador) {
        const url = operador ? (operador.urlIcono || operador.icon || operador.logo) : null;
        if (!url) return `<span style="font-size: 1.2rem; margin-right: 5px; vertical-align: middle;">🟧</span>`;
        
        const esImagen = url.startsWith("http") || url.includes("/") || url.includes(".");
        return esImagen
            ? `<img src="${url}" alt="${operador?.siglas || 'N/A'}" width="20" style="margin-right: 5px; vertical-align: middle;">`
            : `<span style="font-size: 1.2rem; margin-right: 5px; vertical-align: middle;">${url}</span>`;
    }

    #getAccionesGestor(esGestor, opId) {
        if (!esGestor) return "";
        return `
            <nav class="acciones-gestor">
                <button class="btn-icon btn-editar" data-id="${opId}" title="Editar">✏️</button>
                <button class="btn-icon btn-borrar" data-id="${opId}" title="Borrar">🗑️</button>
            </nav>
        `;
    }
}