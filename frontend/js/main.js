import { inicializarDatos } from "./data/seed.js";
// 📦 1. Importamos las nuevas vistas generadoras de HTML
import { LayoutView } from "./views/LayoutView.js";
import { AdminModalsView } from "./views/AdminModalsView.js";
// 🎮 2. Importamos los Controladores
import { ThemeController } from "./controllers/ThemeController.js";
import { AuthController } from "./controllers/AuthController.js";
import { TableroController } from "./controllers/TableroController.js";
import { AdminController } from "./controllers/AdminController.js";

const TIEMPO_REFRESCO_MS = 60000;

document.addEventListener("DOMContentLoaded", () => {
    console.log("✈️ Sistema Iniciado - Arquitectura MVC Modular Full JS");
    
    // 1. Cargar Base de Datos Semilla
    inicializarDatos();

    // 🏗️ 2. CONSTRUIR EL DOM (¡Fundamental que vaya aquí!)
    // Generamos el HTML base y los modales antes de que los controladores los busquen
    new LayoutView();
    new AdminModalsView();

    // 🌗 3. Iniciar Gestor de Tema Oscuro/Claro
    ThemeController.init();

    // 📊 4. Iniciar el Tablero Principal (El corazón de la app)
    const tableroController = new TableroController();

    // 🔐 5. Iniciar Controladores secundarios pasándoles la función para repintar la tabla
    const authController = new AuthController(() => tableroController.aplicarFiltros());
    const adminController = new AdminController(() => tableroController.aplicarFiltros());

    // 🚀 6. Arrancar la máquina
    tableroController.aplicarFiltros();
    
    // 🔄 7. Bucle de refresco automático
    setInterval(() => { 
        console.log("Refrescando tablero de operaciones... 🔄"); 
        tableroController.aplicarFiltros(); 
    }, TIEMPO_REFRESCO_MS); 
});