// Importamos la librería para generar el ID único de 26 caracteres
import { ulid } from "https://esm.sh/ulid";

// 🧊 Congelamos las opciones para evitar errores de escritura (Fake Enums)
export const TIPOS_OPERACION = Object.freeze({
    VUELO: "vuelo",
    TREN: "tren"
});

export const SENTIDOS = Object.freeze({
    SALIDA: "salida",
    LLEGADA: "llegada"
});

export const ESTADOS = Object.freeze({
    PROGRAMADO: "PROGRAMADO",
    EMBARCANDO: "EMBARCANDO",
    RETRASADO: "RETRASADO",
    CANCELADO: "CANCELADO",
    EN_RUTA: "EN_RUTA",
    LLEGADO: "LLEGADO"
});

export class Operacion {
    constructor(tipo, codigo, sentido, origen, destino, horaProgramada, operadorId, puntoId) {
        
        // Validaciones estrictas de tipos y sentidos
        if (!Object.values(TIPOS_OPERACION).includes(tipo)) {
            throw new Error(`Tipo de operación inválido: ${tipo}`);
        }
        if (!Object.values(SENTIDOS).includes(sentido)) {
            throw new Error(`Sentido inválido: ${sentido}`);
        }

        // Generamos el identificador único de la operación (ULID)
        this.operacionId = ulid(); 

        
        this.tipo = tipo;
        this.codigo = codigo;       
        this.sentido = sentido;
        this.origen = origen;
        this.destino = destino;
        
        //  Gestión de tiempos 
        this.horaProgramada = new Date(horaProgramada);
        this.horaEstimada = new Date(horaProgramada); 
        
        // 🚦 Estado inicial
        this.estado = ESTADOS.PROGRAMADO;

        
        this.operadorId = operadorId; 
        this.puntoId = puntoId;       
    }

    //cambiamos solo a estados posibles en el enum
    cambiarEstado(nuevoEstado) {
        const estadosValidos = Object.values(ESTADOS);
        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error(`Estado "${nuevoEstado}" no permitido. Usa: ${estadosValidos.join(", ")}`);
        }
        this.estado = nuevoEstado;
        console.log(`Estado de la operación ${this.codigo} actualizado a: ${this.estado}`);
    }

    // Métodos de utilidad que nos vendrán bien para las vistas
    esVuelo() {
        return this.tipo === TIPOS_OPERACION.VUELO;
    }

    esTren() {
        return this.tipo === TIPOS_OPERACION.TREN;
    }
}