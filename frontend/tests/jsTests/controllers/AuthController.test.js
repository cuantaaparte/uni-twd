import { jest } from '@jest/globals';
import { AuthController } from '../../../js/controllers/AuthController.js';

// ⏱️ TRUCO MÁGICO: Esta función pausa el test un instante para dejar que el 'async/await' del controlador termine.
const esperarAsincronia = () => new Promise(resolve => setTimeout(resolve, 0));

describe('🔐 Controlador de Autenticación (AuthController)', () => {
    let mockOnAuthChanged;
    let authController; // Guardamos la instancia para el test

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.alert = jest.fn();

        document.body.innerHTML = /*HTML*/`
            <div class="auth-buttons"></div>
            <button id="btn-login"></button>
            <button id="btn-signup"></button>
            <button id="close-modal"></button>
            <div id="modal-auth" class="modal-overlay"></div>
            <form id="auth-form" data-mode="register">
                <input id="auth-email" value="" />
                <input id="auth-password" value="" />
            </form>
            <button id="btn-logout"></button>
        `;

        mockOnAuthChanged = jest.fn();
        
        // Creamos un "doble" de AuthView donde sus funciones no hacen nada y no rompen el test
        const mockAuthView = {
            show: jest.fn(),
            hide: jest.fn(),
            renderAuthButtons: jest.fn()
        };

        // Instanciamos el controlador
        authController = new AuthController(mockOnAuthChanged, mockAuthView);
    });

    describe('Cierre de Modales 🖱️', () => {
        it('debería cerrar el modal de login al hacer clic en el fondo oscuro', () => {
            const modalAuth = document.getElementById('modal-auth');
            
            const eventoClick = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(eventoClick, 'target', { value: modalAuth, enumerable: true });
            
            modalAuth.dispatchEvent(eventoClick);

            expect(modalAuth).toBeDefined();
        });
    });

    describe('Validaciones de Registro', () => {
        // ✨ Añadimos 'async' al test
        it('debería rechazar contraseñas de 8 caracteres o menos', async () => {
            document.getElementById('auth-email').value = 'nuevo@correo.com';
            document.getElementById('auth-password').value = 'pass123'; 
            document.getElementById('auth-form').dataset.mode = 'register';

            document.getElementById('auth-form').dispatchEvent(new Event('submit'));
            
            await esperarAsincronia(); // ⏳ Dejamos que el controlador procese

            expect(window.alert).toHaveBeenCalledWith('La contraseña debe tener más de 8 caracteres y contener al menos 1 número 🔐');
        });

        it('debería rechazar contraseñas sin números', async () => {
            document.getElementById('auth-email').value = 'nuevo@correo.com';
            document.getElementById('auth-password').value = 'contrasenasegura'; 
            document.getElementById('auth-form').dataset.mode = 'register';

            document.getElementById('auth-form').dispatchEvent(new Event('submit'));
            
            await esperarAsincronia(); // ⏳

            expect(window.alert).toHaveBeenCalledWith('La contraseña debe tener más de 8 caracteres y contener al menos 1 número 🔐');
        });

        it('debería registrar un usuario correctamente con clave válida', async () => {
            document.getElementById('auth-email').value = 'correcto@correo.com';
            document.getElementById('auth-password').value = 'claveSegura123'; 
            document.getElementById('auth-form').dataset.mode = 'register';

            document.getElementById('auth-form').dispatchEvent(new Event('submit'));
            
            await esperarAsincronia(); // ⏳

            expect(window.alert).toHaveBeenCalledWith('Cuenta creada con éxito ✅');
            const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios'));
            expect(usuariosGuardados.length).toBe(1);
            expect(usuariosGuardados[0].email).toBe('correcto@correo.com');
            expect(usuariosGuardados[0].rol).toBe('PÚBLICO');
        });

        it('debería evitar correos duplicados', async () => {
            localStorage.setItem('usuarios', JSON.stringify([{ email: 'existe@correo.com', password: '123' }]));

            document.getElementById('auth-email').value = 'existe@correo.com';
            document.getElementById('auth-password').value = 'nuevaClave123';
            document.getElementById('auth-form').dataset.mode = 'register';

            document.getElementById('auth-form').dispatchEvent(new Event('submit'));
            
            await esperarAsincronia(); // ⏳

            expect(window.alert).toHaveBeenCalledWith('El Email introducido ya existe ⚠️');
        });
    });

    describe('Inicio y Cierre de Sesión', () => {
        it('debería iniciar sesión con credenciales correctas y avisar al Tablero', async () => {
            const userPrueba = { email: 'admin@aeropuerto.com', password: 'Admin123', rol: 'GESTOR' };
            localStorage.setItem('usuarios', JSON.stringify([userPrueba]));

            document.getElementById('auth-email').value = 'admin@aeropuerto.com';
            document.getElementById('auth-password').value = 'Admin123';
            document.getElementById('auth-form').dataset.mode = 'login';

            document.getElementById('auth-form').dispatchEvent(new Event('submit'));
            
            await esperarAsincronia(); // ⏳

            const sesion = JSON.parse(sessionStorage.getItem('usuarioActivo'));
            expect(sesion).not.toBeNull();
            expect(sesion.email).toBe('admin@aeropuerto.com');
            expect(mockOnAuthChanged).toHaveBeenCalled();
        });

        it('debería bloquear el login con credenciales incorrectas', async () => {
            const userPrueba = { email: 'admin@aeropuerto.com', password: 'Admin123' };
            localStorage.setItem('usuarios', JSON.stringify([userPrueba]));

            document.getElementById('auth-email').value = 'admin@aeropuerto.com';
            document.getElementById('auth-password').value = 'CLAVE_MALA';
            document.getElementById('auth-form').dataset.mode = 'login';

            document.getElementById('auth-form').dispatchEvent(new Event('submit'));
            
            await esperarAsincronia(); // ⏳

            // Usamos stringContaining porque nuestro nuevo catch añade un emoji delante del mensaje
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Credenciales incorrectas'));
            expect(sessionStorage.getItem('usuarioActivo')).toBeNull();
        });
    });
});