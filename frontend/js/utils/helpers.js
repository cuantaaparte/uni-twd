export const LONGITUD_ULID = 26;
export const ICONO_POR_DEFECTO = "🟧";

export function generarULID() {
    const caracteresPermitidos = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let ulidGenerado = '';
    for (let i = 0; i < LONGITUD_ULID; i++) {
        ulidGenerado += caracteresPermitidos[Math.floor(Math.random() * caracteresPermitidos.length)];
    }
    return ulidGenerado;
}

export const normalizarIdColumna = (textoColumna) => {
    if (!textoColumna) return "";
    return textoColumna.replace(/[⬆️⬇️]/g, "")
                       .trim()
                       .toUpperCase()
                       .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

//  Lee la información oculta dentro de un Token JWT
export function decodificarJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch(e) {
        console.error("Token inválido", e);
        return null;
    }
}