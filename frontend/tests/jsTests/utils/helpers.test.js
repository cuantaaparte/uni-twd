import { generarULID, normalizarIdColumna, LONGITUD_ULID } from '../../../js/utils/helpers.js';

describe('🧩 Helpers (utils/helpers.js)', () => {

    describe('generarULID()', () => {
        it('debería generar un texto de exactamente 26 caracteres', () => {
            const ulid = generarULID();
            expect(ulid.length).toBe(LONGITUD_ULID);
            expect(ulid.length).toBe(26);
        });

        it('no debería generar letras minúsculas ni caracteres prohibidos', () => {
            const ulid = generarULID();
            // Comprueba que solo haya letras mayúsculas válidas y números (Crockford's Base32)
            const formatoCorrecto = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]+$/.test(ulid);
            expect(formatoCorrecto).toBe(true);
        });

        it('debería generar IDs únicos para no colisionar operaciones', () => {
            const id1 = generarULID();
            const id2 = generarULID();
            expect(id1).not.toBe(id2);
        });
    });

    describe('normalizarIdColumna()', () => {
        it('debería limpiar espacios y convertir todo a mayúsculas', () => {
            expect(normalizarIdColumna('   estado   ')).toBe('ESTADO');
            expect(normalizarIdColumna('codigo')).toBe('CODIGO');
        });

        it('debería eliminar los emojis de flecha (⬆️, ⬇️)', () => {
            expect(normalizarIdColumna('FECHA-HORA ⬆️')).toBe('FECHA-HORA');
            expect(normalizarIdColumna('DESTINO ⬇️')).toBe('DESTINO');
        });

        it('debería quitar tildes para evitar fallos de ordenación', () => {
            expect(normalizarIdColumna('PÚBLICO')).toBe('PUBLICO');
            expect(normalizarIdColumna('OPERACIÓN')).toBe('OPERACION');
        });
    });
});