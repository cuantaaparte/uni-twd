export class Mappers {

    static mapUsuario(apiData) {
        return {
            id: Number(apiData.id),
            email: apiData.email,
            rol: (apiData.role || "PUBLICO").toUpperCase() 
        };
    }

    static mapOperador(apiData) {
        return {
            id: Number(apiData.id),
            operadorId: Number(apiData.id),
            nombre: apiData.nombre,
            siglas: apiData.siglas,
            urlIcono: apiData.urlIcono || ""
        };
    }

    static mapPunto(apiData) {
        const idReal = Number(apiData.puntoId || apiData.PuntoId || apiData.id);
        return {
            id: idReal,
            puntoId: idReal,
            tipo: apiData.tipo,
            codigo: apiData.codigo
        };
    }

    static mapOperacion(apiData) {
        // 🕵️‍♂️ PERFORADORA MATRIOSHKA: Escarbamos en el doble anidamiento de Docker
        
        // 1. Extraer Operador ID
        let opId = null;
        if (apiData.operador && apiData.operador.operador && apiData.operador.operador.id) {
            opId = Number(apiData.operador.operador.id); // Doble capa
        } else if (apiData.operador && apiData.operador.id) {
            opId = Number(apiData.operador.id); // Capa simple
        } else if (apiData.operadorId) {
            opId = Number(apiData.operadorId); // Directo
        }

        // 2. Extraer Punto ID (Cuidado con las mayúsculas en PuntoId)
        let ptId = null;
        if (apiData.punto && apiData.punto.punto && (apiData.punto.punto.puntoId || apiData.punto.punto.PuntoId)) {
            ptId = Number(apiData.punto.punto.puntoId || apiData.punto.punto.PuntoId); // Doble capa
        } else if (apiData.punto && (apiData.punto.puntoId || apiData.punto.PuntoId)) {
            ptId = Number(apiData.punto.puntoId || apiData.punto.PuntoId); // Capa simple
        } else if (apiData.puntoId) {
            ptId = Number(apiData.puntoId); // Directo
        }

        // 3. Extraer el objeto real para la vista
        let realOperador = (apiData.operador && apiData.operador.operador) ? apiData.operador.operador : (apiData.operador || null);
        let realPunto = (apiData.punto && apiData.punto.punto) ? apiData.punto.punto : (apiData.punto || null);

        return {
            id: String(apiData.operacionId || apiData.id), 
            operacionId: String(apiData.operacionId || apiData.id),
            tipo: apiData.tipo,
            codigo: apiData.codigo,
            sentido: apiData.sentido,
            origen: apiData.origen,
            destino: apiData.destino,
            horaProgramada: apiData.horaProgramada,
            horaEstimada: apiData.horaEstimada,
            estado: apiData.estado,
            
            // ✅ IDs reales y extraídos de las profundidades
            operadorId: opId,
            puntoId: ptId,

            operador: realOperador,
            punto: realPunto
        };
    }

    // ==========================================
    // 🗃️ PROCESADOR DE LISTAS INTELIGENTE
    // ==========================================
    static mapLista(listaApi, funcionTraductora) {
        if (!listaApi) return [];
        let arrayReal = listaApi;
        if (!Array.isArray(listaApi) && typeof listaApi === 'object') {
            const claves = Object.keys(listaApi);
            if (claves.length > 0) arrayReal = listaApi[claves[0]];
        }
        if (!arrayReal || !Array.isArray(arrayReal)) return [];
        return arrayReal.map(item => {
            let objetoLimpio = item;
            if (item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 1) {
                objetoLimpio = item[Object.keys(item)[0]];
            }
            return funcionTraductora(objetoLimpio);
        });
    }
}