// js/views/TableroView.js

export class TableroView {
    constructor() {
        this.listaSalidas = document.getElementById("lista-salidas");
        this.listaLlegadas = document.getElementById("lista-llegadas");
    }

    render(operaciones, operadores, puntos) {
        this.listaSalidas.innerHTML = "";
        this.listaLlegadas.innerHTML = "";

        operaciones.forEach(op => {
            // Buscamos el operador. Si no existe, "operador" será undefined
            const operador = operadores.find(o => o.operadorId === op.operadorId);
            const punto = puntos.find(p => p.puntoId === op.puntoId);

            const filaHTML = this.generarFilaHTML(op, operador, punto);

            if (op.sentido === "salida") {
                this.listaSalidas.innerHTML += filaHTML;
            } else {
                this.listaLlegadas.innerHTML += filaHTML;
            }
        });
    }

    generarFilaHTML(op, operador, punto) {
        const hora = new Date(op.horaProgramada).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const ciudad = op.sentido === "salida" ? op.destino : op.origen;

        // 🛡️ SEGURIDAD: Si por lo que sea el operador no existe, definimos valores por defecto
        const nombreOp = operador ? operador.nombre : "Desconocido";
        const iconoOp = operador ? operador.urlIcono : ""; 
        const siglasOp = operador ? operador.siglas : "N/A";

        return `
            <div class="operacion-row">
                <span>${hora}</span>
                <span style="font-weight: bold; color: #0f3460;">${op.codigo}</span>
                <span>${ciudad}</span>
                <span class="operador-info">
                    ${operador ? `<img src="${iconoOp}" alt="${siglasOp}" width="20">` : "❓"} 
                    ${nombreOp}
                </span>
                <span>${punto ? punto.codigo : "---"}</span>
                <span class="estado-tag state-${op.estado.toLowerCase()}">${op.estado}</span>
            </div>
        `;
    }
}