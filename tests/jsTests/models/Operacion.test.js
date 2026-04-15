import { Operacion } from '../../../js/models/Operacion.js';

describe('✈️ Modelo Operacion', () => {
    it('debería instanciar una operación con estado PROGRAMADO por defecto', () => {
        // Ajustado a los argumentos de tu constructor: 
        // tipo, codigo, sentido, origen, destino, horaProgramada, operadorId, puntoId
        const o = new Operacion("vuelo", "IB123", "salida", "Madrid", "París", "2026-05-20T10:00", 1, 1);
        
        expect(o.codigo).toBe("IB123");
        expect(o.estado).toBe("PROGRAMADO");
        expect(o.sentido).toBe("salida");
        expect(o.operacionId.length).toBe(26); // Verifica que tu generarULID funcionó
    });
});