export const TIPOS_PUNTO = Object.freeze({
    PUERTA: "PUERTA",
    VIA: "VIA"
});

export class Punto {
    constructor(id, tipo, codigo){
        //Validación estricta
        const tiposValidos = Object.values(TIPOS_PUNTO);
        if (!tiposValidos.includes(tipo)) {
            throw new Error(`Error: Tipo de punto "${tipo}" inválido. Usa: ${tiposValidos.join(", ")}`);
        }

        this.puntoId = id;
        this.tipo = tipo;     
        this.codigo = codigo; 
    }
}