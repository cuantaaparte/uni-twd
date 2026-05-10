import { Usuario, ROLES_USUARIO } from '../../../js/models/Usuario.js';

describe('👤 Modelo Usuario (models/Usuario.js)', () => {

    it('debería crear un usuario con todos los datos correctos si se le pasa el Rol', () => {
        const email = 'gestor@ficsit.com';
        const pass = 'SuperSegura123';
        const rol = ROLES_USUARIO.GESTOR;

        const nuevoUser = new Usuario(email, pass, rol);

        expect(nuevoUser.email).toBe(email);
        expect(nuevoUser.password).toBe(pass);
        expect(nuevoUser.rol).toBe(rol);
    });

    it('debería asignar el rol PÚBLICO por defecto por motivos de seguridad', () => {
        // Simulamos un registro normal donde no se pasa el rol
        const nuevoUser = new Usuario('viajero@correo.com', 'clave1234');

        expect(nuevoUser.rol).toBe(ROLES_USUARIO.PUBLICO);
    });

    it('debería almacenar el email exactamente como se introduce', () => {
        const emailRaro = '  mI-CoRReo@Prueba.COM  ';
        const user = new Usuario(emailRaro, '1234');
        
        // Si más adelante decides hacer .toLowerCase() o .trim() en la clase,
        // este test fallará y te avisará del cambio de comportamiento.
        expect(user.email).toBe(emailRaro);
    });
});