// js/main.js

import { inicializarDatos } from "./data/seed.js";
import { TableroView } from "./views/TableroView.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("Sistema iniciado...");

    inicializarDatos();

    // 1. Extraemos los datos base (los originales)
    const operacionesOriginales = JSON.parse(localStorage.getItem("operaciones")) || [];
    const operadores = JSON.parse(localStorage.getItem("operadores")) || [];
    const puntos = JSON.parse(localStorage.getItem("puntos")) || [];

    const tablero = new TableroView();
    
    // Capturamos los elementos del HTML
    const inputBusqueda = document.getElementById("busqueda-codigo");
    const selectEstado = document.getElementById("filtro-estado");

    // 2. Función maestra de filtrado
    const aplicarFiltros = () => {
        const textoCriterio = inputBusqueda.value.toLowerCase();
        const estadoCriterio = selectEstado.value;

        // Filtramos el array
        const operacionesFiltradas = operacionesOriginales.filter(op => {
            // Regla 1: ¿Coincide el código?
            const coincideCodigo = op.codigo.toLowerCase().includes(textoCriterio);
            
            // Regla 2: ¿Coincide el estado? (Si es "TODOS", pasa siempre)
            const coincideEstado = estadoCriterio === "TODOS" || op.estado === estadoCriterio;

            return coincideCodigo && coincideEstado;
        });

        // 3. Volvemos a pintar con los resultados del filtro
        tablero.render(operacionesFiltradas, operadores, puntos);
    };

    // 4. Conectamos los eventos
    // 'input' se dispara cada vez que el usuario teclea
    inputBusqueda.addEventListener("input", aplicarFiltros);
    
    // 'change' se dispara cuando cambia el select
    selectEstado.addEventListener("change", aplicarFiltros);

    // Pintado inicial (con todo)
    tablero.render(operacionesOriginales, operadores, puntos);
});