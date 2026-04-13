//importamos datos de prueba!!!

//primero lo k usaremos
import { Usuario, ROLES_USUARIO } from "../models/Usuario.js";
import { Operador } from "../models/Operador.js";
import { Punto, TIPOS_PUNTO } from "../models/Punto.js";
import { Operacion, SENTIDOS, TIPOS_OPERACION } from "../models/Operacion.js";

//ahora a meter datos
export function inicializarDatos(){
    //comprobamos si ya había datos
    if(localStorage.getItem("usuarios") && localStorage.getItem("operaciones")){
        console.log("ya tenemos datos !!!");
        return;
    }

    console.log("generando datos...");

    //usuarios
    const usuarios = [
        new Usuario("admin@aerogestor.com", "admin", ROLES_USUARIO.GESTOR),
        new Usuario("viajero1@aeropuerto.com", "viajero1", ROLES_USUARIO.PUBLICO)
    ];

    //operadores
    const operadores = [
        new Operador(1, "Iberia", "IB", "#d7192d", "./assets/iberia.png"),
        new Operador(2, "Renfe", "AVE", "#4a3b82", "./assets/renfe.png")
    ];

    //puntos
    const puntos = [
        new Punto(1, TIPOS_PUNTO.PUERTA, "T1-A01"),
        new Punto(2, TIPOS_PUNTO.VIA, "Vía 4")
    ]

    //operaciones
    const ahora = new Date().getTime();
    const operaciones = [
        new Operacion(TIPOS_OPERACION.VUELO, "IB1234", SENTIDOS.SALIDA, "Madrid", "París", ahora+7200000, 1, 1),
        new Operacion(TIPOS_OPERACION.TREN, "AVE1234", SENTIDOS.LLEGADA, "Sevilla", "Madrid", ahora - 3600000, 2, 2)
    ];

    /*
        GUARDADO EN LOCALSTORAGE
    */

    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    localStorage.setItem("operadores", JSON.stringify(operadores));
    localStorage.setItem("puntos", JSON.stringify(puntos));
    localStorage.setItem("operaciones", JSON.stringify(operaciones));

    console.log("Datos guardados con éxito");
}