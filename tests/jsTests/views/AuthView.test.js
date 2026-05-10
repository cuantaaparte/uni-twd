import { jest } from '@jest/globals';
import { AuthView } from '../../../js/views/AuthView.js';

describe('🔐 Tests de Vista: AuthView', () => {
    let authView;

    beforeEach(() => {
        // Simulamos los botones que el LayoutView habría inyectado antes
        document.body.innerHTML = /* html */`
            <button id="btn-login"></button>
            <button id="btn-signup"></button>
            <button id="btn-logout" class="hidden"></button>
            <button id="btn-nueva-operacion" class="hidden"></button>
            <button id="btn-gestionar-usuarios" class="hidden"></button>
            <button id="btn-gestionar-operadores" class="hidden"></button>
            <button id="btn-gestionar-puntos" class="hidden"></button>
        `;
        authView = new AuthView();
    });

    it('debería inyectar el modal de autenticación', () => {
        const modalAuth = document.getElementById('modal-auth');
        expect(modalAuth).not.toBeNull();
    });

    it('debería mostrar el modal en modo Registro', () => {
        authView.show(true); // true = esRegistro
        
        expect(document.getElementById('modal-auth').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('modal-title').innerText).toBe('Crear Cuenta');
        expect(document.getElementById('auth-submit').innerText).toBe('Registrarse');
    });

    it('debería mostrar el modal en modo Login', () => {
        authView.show(false); // false = esLogin
        
        expect(document.getElementById('modal-auth').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('modal-title').innerText).toBe('Iniciar Sesión');
    });

    it('debería ocultar botones de admin y mostrar login si NO hay usuario', () => {
        authView.renderAuthButtons(null);

        expect(document.getElementById('btn-login').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('btn-logout').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('btn-nueva-operacion').classList.contains('hidden')).toBe(true);
    });

    it('debería mostrar solo botón logout si el usuario es PÚBLICO', () => {
        const usuarioPublico = { rol: 'PÚBLICO' };
        authView.renderAuthButtons(usuarioPublico);

        expect(document.getElementById('btn-login').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('btn-logout').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('btn-nueva-operacion').classList.contains('hidden')).toBe(true);
    });

    it('debería mostrar todos los botones de administración si el usuario es GESTOR', () => {
        const usuarioGestor = { rol: 'GESTOR' };
        authView.renderAuthButtons(usuarioGestor);

        expect(document.getElementById('btn-logout').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('btn-nueva-operacion').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('btn-gestionar-usuarios').classList.contains('hidden')).toBe(false);
    });
});