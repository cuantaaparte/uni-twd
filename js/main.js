import { inicializarDatos } from "./data/seed.js";
import { TableroView } from "./views/TableroView.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("Sistema iniciado. Comprobando la base de datos local...");

    inicializarDatos();

    // 2. Extraemos los datos del localStorage
    const operaciones = JSON.parse(localStorage.getItem("operaciones"));
    const operadores = JSON.parse(localStorage.getItem("operadores"));
    const puntos = JSON.parse(localStorage.getItem("puntos"));

    // 3. Creamos la vista y pintamos
    const tablero = new TableroView();
    tablero.render(operaciones, operadores, puntos);
})