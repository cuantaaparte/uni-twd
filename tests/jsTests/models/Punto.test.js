import { Punto } from '../../../js/models/Punto.js';
describe('📍 Modelo Punto', () => {
    it('debería crear un punto con ID, tipo y código', () => {
        const p = new Punto(5, "PUERTA", "P-10");
        expect(p.puntoId).toBe(5);
        expect(p.codigo).toBe("P-10");
    });
});