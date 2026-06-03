//import { inicializarDatos } from "./data/seed.js";
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
    //inicializarDatos();

    // 🏗️ 2. CONSTRUIR EL DOM (¡Fundamental que vaya aquí!)
    // Generamos el HTML base y los modales antes de que los controladores los busquen
    new LayoutView();
    new AdminModalsView();

    // 💡 3. INICIAR TEMA (Ahora el DOM ya existe y el botón #checkbox-theme está ahí)
    ThemeController.init();

    // 📊 4. Iniciar el Tablero Principal (El corazón de la app)
    const tableroController = new TableroController();

    // 🔐 5. Iniciar Controladores secundarios pasándoles la función para recargar los datos
    const authController = new AuthController(() => tableroController.cargarDatos());
    const adminController = new AdminController(() => tableroController.cargarDatos());

    // 🚀 6. Arrancar la máquina pidiendo los datos al servidor
    tableroController.cargarDatos();
    
    // 🔄 7. Bucle de refresco automático
    setInterval(() => { 
        console.log("Refrescando datos del servidor... 🔄"); 
        tableroController.cargarDatos(); 
    }, TIEMPO_REFRESCO_MS); 
});