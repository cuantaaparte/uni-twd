// importamos datos de prueba!!!

// primero lo k usaremos
//import { Usuario, ROLES_USUARIO } from "../models/Usuario.js";
import { Operador } from "../models/Operador.js";
import { Punto, TIPOS_PUNTO } from "../models/Punto.js";
import { Operacion, SENTIDOS, TIPOS_OPERACION } from "../models/Operacion.js";

// ahora a meter datos
export function inicializarDatos(){
    // comprobamos si ya había datos
    if(localStorage.getItem("usuarios") && localStorage.getItem("operaciones")){
        console.log("ya tenemos datos !!!");
        return;
    }

    console.log("generando datos enriquecidos...");

    // 👤 USUARIOS (Gestores y Público)
    /*
    const usuarios = [
        new Usuario("admin@aerogestor.com", "admin", ROLES_USUARIO.GESTOR),
        new Usuario("admin@admin.com", "admin", ROLES_USUARIO.GESTOR), // Nuevo Admin
        new Usuario("viajero1@aeropuerto.com", "viajero1", ROLES_USUARIO.PUBLICO),
        new Usuario("user1@gmail.com", "user1", ROLES_USUARIO.PUBLICO),
        new Usuario("user2@gmail.com", "user2", ROLES_USUARIO.PUBLICO),
        new Usuario("user3@gmail.com", "user3", ROLES_USUARIO.PUBLICO),
        new Usuario("user4@gmail.com", "user4", ROLES_USUARIO.PUBLICO)
    ];*/

    // 🏢 OPERADORES (Vuelos y Trenes con imágenes camelCase)
    const operadores = [
        new Operador(1, "Iberia", "IB", "#d7192d", "./assets/iberia.png"),
        new Operador(2, "Renfe", "AVE", "#4a3b82", "./assets/renfe.png"),
        new Operador(3, "Air Europa", "AEA", "#003b7a", "./assets/airEuropa.png"),
        new Operador(4, "Ouigo", "OUI", "#e00073", "./assets/ouigo.png"),
        new Operador(5, "Ryanair", "RYR", "#073590", "./assets/ryanair.png"),
        new Operador(6, "Iryo", "IRY", "#d40000", "./assets/iryo.png")
    ];

    // 🚪 PUNTOS (Puertas para vuelos, Vías para trenes)
    const puntos = [
        new Punto(1, TIPOS_PUNTO.PUERTA, "T1-A01"),
        new Punto(2, TIPOS_PUNTO.VIA, "Vía 4"),
        new Punto(3, TIPOS_PUNTO.PUERTA, "T2-B05"),
        new Punto(4, TIPOS_PUNTO.PUERTA, "T3-C12"),
        new Punto(5, TIPOS_PUNTO.VIA, "Vía 1"),
        new Punto(6, TIPOS_PUNTO.VIA, "Vía 7")
    ];

    // ⏳ CONSTANTES DE TIEMPO (Para la máquina del tiempo)
    const ahora = Date.now();
    const HORA = 3600000;
    const DIA = 86400000;

    // ✈️ OPERACIONES (Viajes en el tiempo y variedad de estados)
    const operaciones = [
        // 0. ANTEAYER (-48h) | Tren | Llegada | LLEGADO
        new Operacion(TIPOS_OPERACION.TREN, "IRY99", SENTIDOS.LLEGADA, "Barcelona", "Madrid", ahora - (DIA * 2), 6, 6),
        
        // 1. AYER (-24h) | Vuelo | Salida | CANCELADO
        new Operacion(TIPOS_OPERACION.VUELO, "RYR55", SENTIDOS.SALIDA, "Madrid", "Londres", ahora - DIA, 5, 4),
        
        // 2. HACE 4 HORAS (-4h) | Vuelo | Llegada | LLEGADO
        new Operacion(TIPOS_OPERACION.VUELO, "AEA22", SENTIDOS.LLEGADA, "Roma", "Madrid", ahora - (HORA * 4), 3, 3),
        
        // 3. HOY - Hace 1 hora (-1h) | Vuelo | Salida | EN_RUTA
        new Operacion(TIPOS_OPERACION.VUELO, "IB1234", SENTIDOS.SALIDA, "Madrid", "París", ahora - HORA, 1, 1),

        // 4. HOY - Ahora mismo (0h) | Tren | Salida | EMBARCANDO
        new Operacion(TIPOS_OPERACION.TREN, "OUI33", SENTIDOS.SALIDA, "Madrid", "Valencia", ahora, 4, 5),

        // 5. HOY - Dentro de 4 horas (+4h) | Tren | Llegada | RETRASADO
        new Operacion(TIPOS_OPERACION.TREN, "AVE1234", SENTIDOS.LLEGADA, "Sevilla", "Madrid", ahora + (HORA * 4), 2, 2),

        // 6. MAÑANA (+24h) | Vuelo | Salida | PROGRAMADO
        new Operacion(TIPOS_OPERACION.VUELO, "RYR88", SENTIDOS.SALIDA, "Madrid", "Dublín", ahora + DIA, 5, 1),

        // 7. PASADO MAÑANA (+48h) | Vuelo | Llegada | PROGRAMADO
        new Operacion(TIPOS_OPERACION.VUELO, "AEA77", SENTIDOS.LLEGADA, "Nueva York", "Madrid", ahora + (DIA * 2), 3, 4),

        // 8. ANTEAYER (-48h) | Vuelo | Salida | LLEGADO
        new Operacion(TIPOS_OPERACION.VUELO, "AEA11", SENTIDOS.SALIDA, "Madrid", "Berlín", ahora - (DIA * 2), 3, 3),

        // 9. AYER (-24h) | Tren | Llegada | LLEGADO
        new Operacion(TIPOS_OPERACION.TREN, "IRY22", SENTIDOS.LLEGADA, "Sevilla", "Madrid", ahora - DIA, 6, 6),

        // 10. HACE 4 HORAS (-4h) | Vuelo | Salida | LLEGADO
        new Operacion(TIPOS_OPERACION.VUELO, "IB555", SENTIDOS.SALIDA, "Madrid", "Roma", ahora - (HORA * 4), 1, 1),

        // 11. DENTRO DE 4 HORAS (+4h) | Vuelo | Salida | PROGRAMADO
        new Operacion(TIPOS_OPERACION.VUELO, "RYR99", SENTIDOS.SALIDA, "Madrid", "Londres", ahora + (HORA * 4), 5, 4),

        // 12. MAÑANA (+24h) | Tren | Llegada | PROGRAMADO
        new Operacion(TIPOS_OPERACION.TREN, "AVE88", SENTIDOS.LLEGADA, "Valencia", "Madrid", ahora + DIA, 2, 2),

        // 13. PASADO MAÑANA (+48h) | Vuelo | Salida | PROGRAMADO
        new Operacion(TIPOS_OPERACION.VUELO, "AEA44", SENTIDOS.SALIDA, "Madrid", "Lisboa", ahora + (DIA * 2), 3, 3),

        // 16. HACE 4 DÍAS (-96h) | Vuelo | Salida | LLEGADO
        new Operacion(TIPOS_OPERACION.VUELO, "RYR777", SENTIDOS.SALIDA, "Madrid", "Roma", ahora - (DIA * 4), 5, 1),

        // 17. HACE 5 DÍAS (-120h) | Tren | Salida | LLEGADO
        new Operacion(TIPOS_OPERACION.TREN, "AVE555", SENTIDOS.SALIDA, "Madrid", "Sevilla", ahora - (DIA * 5), 2, 5)
    ];

    // 🔄 APLICAMOS LOS ESTADOS ESPECÍFICOS (El constructor suele poner PROGRAMADO por defecto)
    operaciones[0].cambiarEstado("LLEGADO");
    operaciones[1].cambiarEstado("CANCELADO");
    operaciones[2].cambiarEstado("LLEGADO");
    operaciones[3].cambiarEstado("EN_RUTA");
    operaciones[4].cambiarEstado("EMBARCANDO");
    operaciones[5].cambiarEstado("RETRASADO");
    operaciones[8].cambiarEstado("LLEGADO");
    operaciones[9].cambiarEstado("LLEGADO");
    operaciones[10].cambiarEstado("LLEGADO");
    operaciones[14].cambiarEstado("LLEGADO");
    operaciones[15].cambiarEstado("LLEGADO");
    // [6] y [7] se quedan como PROGRAMADO por defecto

    /*
        💾 GUARDADO EN LOCALSTORAGE
    */
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    localStorage.setItem("operadores", JSON.stringify(operadores));
    localStorage.setItem("puntos", JSON.stringify(puntos));
    localStorage.setItem("operaciones", JSON.stringify(operaciones));

    console.log("Datos de prueba inyectados con éxito 🚀");
}