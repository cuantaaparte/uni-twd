import { jest } from '@jest/globals';
import { LayoutView } from '../../../js/views/LayoutView.js';

describe('🏗️ Tests de Vista: LayoutView', () => {
    beforeEach(() => {
        document.body.innerHTML = /* html */`<div id="app"></div>`;
    });

    it('debería inyectar el Header, Filtros y Tableros en el contenedor principal', () => {
        new LayoutView();

        const header = document.querySelector('header');
        const filtros = document.getElementById('contenedor-filtros');
        const panelSalidas = document.getElementById('panel-salidas');
        const panelLlegadas = document.getElementById('panel-llegadas');

        // Verificamos que los componentes principales de la UI existen
        expect(header).not.toBeNull();
        expect(filtros).not.toBeNull();
        expect(panelSalidas).not.toBeNull();
        expect(panelLlegadas).not.toBeNull();

        // Verificamos que el título se haya renderizado bien
        expect(header.innerHTML).toContain('Panel Informativo');
    });
});