import { Operador } from '../../../js/models/Operador.js';
describe('🏢 Modelo Operador', () => {
    it('debería crear un operador con sus datos básicos', () => {
        const op = new Operador(1, "Iberia", "IB", "logo.png");
        expect(op.nombre).toBe("Iberia");
        expect(op.siglas).toBe("IB");
    });
});