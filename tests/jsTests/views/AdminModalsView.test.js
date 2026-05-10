import { jest } from '@jest/globals';
import { AdminModalsView } from '../../../js/views/AdminModalsView.js';

describe('🛠️ Tests de Vista: AdminModalsView', () => {
    beforeEach(() => {
        document.body.innerHTML = ''; // Empezamos con el body vacío
    });

    it('debería inyectar los 6 modales de administración en el DOM', () => {
        new AdminModalsView();

        const modalesEsperados = [
            'modal-operacion',
            'modal-crear',
            'modal-usuarios',
            'modal-detalle',
            'modal-operadores',
            'modal-puntos'
        ];

        modalesEsperados.forEach(id => {
            const modal = document.getElementById(id);
            expect(modal).not.toBeNull();
            expect(modal.classList.contains('modal-overlay')).toBe(true);
            expect(modal.classList.contains('hidden')).toBe(true); // Deben nacer ocultos
        });
    });

    it('no debería duplicar los modales si se instancia dos veces', () => {
        new AdminModalsView();
        new AdminModalsView(); // Intentamos inyectar de nuevo

        // Solo debe haber un modal de cada tipo
        const modalesCrear = document.querySelectorAll('#modal-crear');
        expect(modalesCrear.length).toBe(1);
    });
});