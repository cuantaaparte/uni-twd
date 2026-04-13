// js/views/TableroView.js

export class TableroView {
    constructor() {
        this.listaSalidas = document.getElementById("lista-salidas");
        this.listaLlegadas = document.getElementById("lista-llegadas");
        this.panelSalidas = document.getElementById("panel-salidas");
        this.panelLlegadas = document.getElementById("panel-llegadas");
    }

    render(salidas, llegadas, operadores, puntos, usuarioActivo = null) {
        this.listaSalidas.innerHTML = "";
        this.listaLlegadas.innerHTML = "";

        const esGestor = usuarioActivo && usuarioActivo.rol === "GESTOR";

        [this.panelSalidas, this.panelLlegadas].forEach(panel => 
            esGestor ? panel.classList.add("modo-gestor") : panel.classList.remove("modo-gestor")
        );

        salidas.forEach(operacion => {
            const operadorEncontrado = operadores.find(operador => operador.operadorId === operacion.operadorId);
            const puntoEncontrado = puntos.find(punto => punto.puntoId === operacion.puntoId);
            this.listaSalidas.innerHTML += this.generarFilaHTML(operacion, operadorEncontrado, puntoEncontrado, esGestor);
        });

        llegadas.forEach(operacion => {
            const operadorEncontrado = operadores.find(operador => operador.operadorId === operacion.operadorId);
            const puntoEncontrado = puntos.find(punto => punto.puntoId === operacion.puntoId);
            this.listaLlegadas.innerHTML += this.generarFilaHTML(operacion, operadorEncontrado, puntoEncontrado, esGestor);
        });
    }

    generarFilaHTML(operacion, operador, punto, esGestor) {
        // --- LÓGICA DE FECHAS (Hoy, Mañana, Otros) --- 📅
        const fechaOperacion = new Date(operacion.horaProgramada);
        
        // Obtenemos el inicio del día actual
        const fechaHoy = new Date();
        fechaHoy.setHours(0, 0, 0, 0);
        
        // Obtenemos el inicio del día de mañana
        const fechaManana = new Date(fechaHoy);
        fechaManana.setDate(fechaManana.getDate() + 1);
        
        // Obtenemos el inicio del día de la operación (para comparar peras con peras)
        const diaOperacion = new Date(fechaOperacion);
        diaOperacion.setHours(0, 0, 0, 0);

        let textoFechaHora = "";
        const formatoSoloHora = fechaOperacion.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const formatoSoloFecha = fechaOperacion.toLocaleDateString();

        if (diaOperacion.getTime() === fechaHoy.getTime()) {
            textoFechaHora = formatoSoloHora; // Si es Hoy -> "14:30"
        } else if (diaOperacion.getTime() === fechaManana.getTime()) {
            textoFechaHora = `M-${formatoSoloHora}`; // Si es Mañana -> "M-14:30"
        } else {
            textoFechaHora = formatoSoloFecha; // Si es otro día -> "15/04/2026"
        }

        // --- RESTO DE DATOS ---
        const ciudadDestinoOrigen = operacion.sentido === "salida" ? operacion.destino : operacion.origen;
        const nombreOperador = operador ? operador.nombre : "Desconocido";
        const iconoOperador = operador ? operador.urlIcono : ""; 
        const siglasOperador = operador ? operador.siglas : "N/A";

        let htmlAccionesAdmin = "";
        if (esGestor) {
            htmlAccionesAdmin = `
                <nav class="acciones-gestor">
                    <button class="btn-icon btn-editar" data-id="${operacion.operacionId}" title="Editar">✏️</button>
                    <button class="btn-icon btn-borrar" data-id="${operacion.operacionId}" title="Borrar">🗑️</button>
                </nav>
            `;
        }

        return `
            <article class="operacion-row" data-id="${operacion.operacionId}">
                <span>${textoFechaHora}</span>
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