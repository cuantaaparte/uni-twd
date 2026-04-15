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