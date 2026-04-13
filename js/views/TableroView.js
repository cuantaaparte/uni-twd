// js/views/TableroView.js

export class TableroView {
    constructor() {
        this.listaSalidas = document.getElementById("lista-salidas");
        this.listaLlegadas = document.getElementById("lista-llegadas");
        this.panelSalidas = document.getElementById("panel-salidas"); // 🆕 Para el CSS
        this.panelLlegadas = document.getElementById("panel-llegadas"); // 🆕 Para el CSS
    }

    // Recibimos salidas y llegadas por separado
    render(salidas, llegadas, operadores, puntos, usuarioActivo = null) {
        this.listaSalidas.innerHTML = "";
        this.listaLlegadas.innerHTML = "";

        const esGestor = usuarioActivo && usuarioActivo.rol === "GESTOR";

        // Aplicamos clases de modo gestor
        [this.panelSalidas, this.panelLlegadas].forEach(p => 
            esGestor ? p.classList.add("modo-gestor") : p.classList.remove("modo-gestor")
        );

        // Pintamos salidas
        salidas.forEach(op => {
            const operador = operadores.find(o => o.operadorId === op.operadorId);
            const punto = puntos.find(p => p.puntoId === op.puntoId);
            this.listaSalidas.innerHTML += this.generarFilaHTML(op, operador, punto, esGestor);
        });

        // Pintamos llegadas
        llegadas.forEach(op => {
            const operador = operadores.find(o => o.operadorId === op.operadorId);
            const punto = puntos.find(p => p.puntoId === op.puntoId);
            this.listaLlegadas.innerHTML += this.generarFilaHTML(op, operador, punto, esGestor);
        });
    }

    generarFilaHTML(op, operador, punto, esGestor) {
        const hora = new Date(op.horaProgramada).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const ciudad = op.sentido === "salida" ? op.destino : op.origen;

        const nombreOp = operador ? operador.nombre : "Desconocido";
        const iconoOp = operador ? operador.urlIcono : ""; 
        const siglasOp = operador ? operador.siglas : "N/A";

        // 🆕 Generamos los botones de acción SOLO si es gestor
        let htmlAcciones = "";
        if (esGestor) {
            htmlAcciones = `
                <div class="acciones-gestor">
                    <button class="btn-icon btn-editar" data-id="${op.operacionId}" title="Editar">✏️</button>
                    <button class="btn-icon btn-borrar" data-id="${op.operacionId}" title="Borrar">🗑️</button>
                </div>
            `;
        }

        return `
            <div class="operacion-row" data-id="${op.operacionId}">
                <span>${hora}</span>
                <span style="font-weight: bold; color: #0f3460;">${op.codigo}</span>
                <span>${ciudad}</span>
                <span class="operador-info">
                    ${operador ? `<img src="${iconoOp}" alt="${siglasOp}" width="20">` : "❓"} 
                    ${nombreOp}
                </span>
                <span>${punto ? punto.codigo : "---"}</span>
                <span class="estado-tag state-${op.estado.toLowerCase()}">${op.estado}</span>
                ${htmlAcciones} </div>
        `;
    }
}