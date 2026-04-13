// js/views/TableroView.js

export class TableroView {
    constructor() {
        this.listaSalidas = document.getElementById("lista-salidas");
        this.listaLlegadas = document.getElementById("lista-llegadas");
        this.panelSalidas = document.getElementById("panel-salidas"); // 🆕 Para el CSS
        this.panelLlegadas = document.getElementById("panel-llegadas"); // 🆕 Para el CSS
    }

    // 🆕 Ahora recibimos al usuarioActivo como cuarto parámetro
    render(operaciones, operadores, puntos, usuarioActivo = null) {
        this.listaSalidas.innerHTML = "";
        this.listaLlegadas.innerHTML = "";

        // 🆕 ¿Es el jefe?
        const esGestor = usuarioActivo && usuarioActivo.rol === "GESTOR";

        // 🆕 Aplicamos o quitamos la clase CSS que cambia el Grid a 7 columnas
        if (esGestor) {
            this.panelSalidas.classList.add("modo-gestor");
            this.panelLlegadas.classList.add("modo-gestor");
        } else {
            this.panelSalidas.classList.remove("modo-gestor");
            this.panelLlegadas.classList.remove("modo-gestor");
        }

        operaciones.forEach(op => {
            const operador = operadores.find(o => o.operadorId === op.operadorId);
            const punto = puntos.find(p => p.puntoId === op.puntoId);

            // 🆕 Le pasamos el "esGestor" a la fila
            const filaHTML = this.generarFilaHTML(op, operador, punto, esGestor);

            if (op.sentido === "salida") {
                this.listaSalidas.innerHTML += filaHTML;
            } else {
                this.listaLlegadas.innerHTML += filaHTML;
            }
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