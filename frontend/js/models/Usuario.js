// Fake enum
export const ROLES_USUARIO = Object.freeze({
    PUBLICO: 'PÚBLICO',
    GESTOR: 'GESTOR'
});

export class Usuario {
    constructor(email, password, rol = ROLES_USUARIO.PUBLICO) {
        //validamos k no haya roles inventados luego
        const rolesValidos = Object.values(ROLES_USUARIO);
        if (!rolesValidos.includes(rol)) {
            throw new Error(`Error CRÍTICO: Rol '${rol}' inválido. Usa: ${rolesValidos.join(', ')}`);
        }

        this.email = email;
        this.password = password;
        this.rol = rol; 
    }

    esGestor() {
        return this.rol === ROLES_USUARIO.GESTOR;
    }
}