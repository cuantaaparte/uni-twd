// js/views/TableroView.js

export class TableroView {
    constructor() {
        this.listaSalidas = document.getElementById("lista-salidas");
        this.listaLlegadas = document.getElementById("lista-llegadas");
        this.panelSalidas = document.getElementById("panel-salidas");
        this.panelLlegadas = document.getElementById("panel-llegadas");
    }

    // Recibimos salidas y llegadas filtradas y ordenadas
    render(salidas, llegadas, operadores, puntos, usuarioActivo = null) {
        this.listaSalidas.innerHTML = "";
        this.listaLlegadas.innerHTML = "";

        const esGestor = usuarioActivo && usuarioActivo.rol === "GESTOR";

        // Aplicamos clases de modo gestor para UI adaptativa
        [this.panelSalidas, this.panelLlegadas].forEach(panel => 
            esGestor ? panel.classList.add("modo-gestor") : panel.classList.remove("modo-gestor")
        );

        // Renderizamos panel de salidas
        salidas.forEach(operacion => {
            const operadorEncontrado = operadores.find(operador => operador.operadorId === operacion.operadorId);
            const puntoEncontrado = puntos.find(punto => punto.puntoId === operacion.puntoId);
            this.listaSalidas.innerHTML += this.generarFilaHTML(operacion, operadorEncontrado, puntoEncontrado, esGestor);
        });

        // Renderizamos panel de llegadas
        llegadas.forEach(operacion => {
            const operadorEncontrado = operadores.find(operador => operador.operadorId === operacion.operadorId);
            const puntoEncontrado = puntos.find(punto => punto.puntoId === operacion.puntoId);
            this.listaLlegadas.innerHTML += this.generarFilaHTML(operacion, operadorEncontrado, puntoEncontrado, esGestor);
        });
    }

    generarFilaHTML(operacion, operador, punto, esGestor) {
        const horaFormateada = new Date(operacion.horaProgramada).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const ciudadDestinoOrigen = operacion.sentido === "salida" ? operacion.destino : operacion.origen;

        const nombreOperador = operador ? operador.nombre : "Desconocido";
        const iconoOperador = operador ? operador.urlIcono : ""; 
        const siglasOperador = operador ? operador.siglas : "N/A";

        // Controles exclusivos para usuarios con rol GESTOR
        let htmlAccionesAdmin = "";
        if (esGestor) {
            htmlAccionesAdmin = `
                <nav class="acciones-gestor">
                    <button class="btn-icon btn-editar" data-id="${operacion.operacionId}" title="Editar">✏️</button>
                    <button class="btn-icon btn-borrar" data-id="${operacion.operacionId}" title="Borrar">🗑️</button>
                </nav>
            `;
        }

        // Usamos <article> para la fila semántica
        return `
            <article class="operacion-row" data-id="${operacion.operacionId}">
                <span>${horaFormateada}</span>
                <span style="font-weight: bold; color: var(--accent-blue, #0f3460);">${operacion.codigo}</span>
                <span>${ciudadDestinoOrigen}</span>
                <span class="operador-info">
                    ${operador ? `<img src="${iconoOperador}" alt="${siglasOperador}" width="20">` : "❓"} 
                    ${nombreOperador}
                </span>
                <span>${punto ? punto.codigo : "---"}</span>
                <span class="estado-tag state-${operacion.estado.toLowerCase()}">${operacion.estado}</span>
                ${htmlAccionesAdmin} 
            </article>
        `;
    }
}