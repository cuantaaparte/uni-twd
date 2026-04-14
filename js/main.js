import { inicializarDatos } from "./data/seed.js";
import { ThemeController } from "./controllers/ThemeController.js";
import { AuthController } from "./controllers/AuthController.js";
import { TableroController } from "./controllers/TableroController.js";
import { AdminController } from "./controllers/AdminController.js";

const TIEMPO_REFRESCO_MS = 60000;

document.addEventListener("DOMContentLoaded", () => {
    console.log("✈️ Sistema Iniciado - Arquitectura MVC Modular");
    
    // 1. Cargar Base de Datos Semilla
    inicializarDatos();

    // 2. Iniciar Gestor de Tema Oscuro/Claro
    ThemeController.init();

    // 3. Iniciar el Tablero Principal (El corazón de la app)
    const tableroController = new TableroController();

    // 4. Iniciar Controladores secundarios pasándoles la función para repintar la tabla
    const authController = new AuthController(() => tableroController.aplicarFiltros());
    const adminController = new AdminController(() => tableroController.aplicarFiltros());

    // 5. Arrancar la máquina
    tableroController.aplicarFiltros();
    setInterval(() => { 
        console.log("Refrescando tablero de operaciones... 🔄"); 
        tableroController.aplicarFiltros(); 
    }, TIEMPO_REFRESCO_MS); 
});