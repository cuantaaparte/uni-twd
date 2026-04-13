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
        // --- 📅 LÓGICA DE FECHAS (Hoy, Mañana, Otros) --- 
        const fechaOperacion = new Date(operacion.horaProgramada);
        
        // 🔴 Comprobar si la fecha es pasada (para poner en rojo)
        const timestampOperacion = fechaOperacion.getTime();
        const esPasada = timestampOperacion < Date.now();
        // En vez de clase de CSS, inyectamos el estilo directo rojo brillante si es pasada
        const estiloColorFecha = esPasada ? "color: #ff4d4d; font-weight: bold;" : ""; 
        
        // Obtenemos el inicio del día actual
        const fechaHoy = new Date();
        fechaHoy.setHours(0, 0, 0, 0);
        
        // Obtenemos el inicio del día de mañana
        const fechaManana = new Date(fechaHoy);
        fechaManana.setDate(fechaManana.getDate() + 1);
        
        // Obtenemos el inicio del día de la operación
        const diaOperacion = new Date(fechaOperacion);
        diaOperacion.setHours(0, 0, 0, 0);

        let textoFechaHora = "";
        const formatoSoloHora = fechaOperacion.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const formatoSoloFecha = fechaOperacion.toLocaleDateString();

        if (diaOperacion.getTime() === fechaHoy.getTime()) {
            textoFechaHora = formatoSoloHora; 
        } else if (diaOperacion.getTime() === fechaManana.getTime()) {
            textoFechaHora = `M-${formatoSoloHora}`; 
        } else {
            textoFechaHora = formatoSoloFecha; 
        }

        // --- 🟧 LÓGICA DE ICONOS Y EMOJIS ---
        const urlIcono = operador ? operador.urlIcono : "🟧";
        const siglasOperador = operador ? operador.siglas : "N/A";
        
        // Ahora detecta si empieza por http, si tiene una barra de carpeta (/) o un punto de extensión (.png)
        const esImagen = urlIcono && (urlIcono.startsWith("http") || urlIcono.includes("/") || urlIcono.includes("."));

        const htmlIcono = esImagen
            ? `<img src="${urlIcono}" alt="${siglasOperador}" width="20" style="margin-right: 5px; vertical-align: middle;">`
            : `<span style="font-size: 1.2rem; margin-right: 5px; vertical-align: middle;">${urlIcono}</span>`;

        // --- RESTO DE DATOS ---
        const ciudadDestinoOrigen = operacion.sentido === "salida" ? operacion.destino : operacion.origen;
        const nombreOperador = operador ? operador.nombre : "Desconocido";

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