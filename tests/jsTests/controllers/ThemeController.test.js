import { jest } from '@jest/globals';
import { ThemeController } from '../../../js/controllers/ThemeController.js';

describe('🌓 Controlador de Tema (ThemeController)', () => {
    beforeEach(() => {
        localStorage.clear();
        
        document.body.innerHTML = /*HTML*/`
            <input type="checkbox" id="checkbox-theme" />
        `;
        document.body.className = "";
    });

    it('debería activar modo oscuro si el checkbox se desmarca (checked = false)', () => {
        ThemeController.init();
        const checkbox = document.getElementById("checkbox-theme");
        
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));

        expect(document.body.classList.contains("dark-mode")).toBe(true);
        expect(localStorage.getItem("tema")).toBe("dark"); 
    });

    it('debería cargar el tema oscuro por defecto al iniciar', () => {
        ThemeController.init();
        
        expect(document.body.classList.contains("dark-mode")).toBe(true);
        expect(document.getElementById("checkbox-theme").checked).toBe(false);
    });

    it('debería cambiar a modo claro si el checkbox se marca (checked = true)', () => {
        ThemeController.init();
        const checkbox = document.getElementById("checkbox-theme");

        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));

        expect(document.body.classList.contains("dark-mode")).toBe(false);
        expect(localStorage.getItem("tema")).toBe("light");
    });
});