// js/main.js

import { inicializarDatos } from "./data/seed.js";
import { TableroView } from "./views/TableroView.js";
import { AuthView } from "./views/AuthView.js";
import { Usuario, ROLES_USUARIO } from "./models/Usuario.js";

// --- CONSTANTES GLOBALES (Clean Code) ---
const TIEMPO_REFRESCO_MS = 60000;
const LONGITUD_ULID = 26;
const ROL_GESTOR = "GESTOR";
const ROL_PUBLICO = "PÚBLICO";
const ICONO_POR_DEFECTO = "https://cdn-icons-png.flaticon.com/512/782/782073.png";

// --- HELPERS ---
function generarULID() {
    const caracteresPermitidos = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let ulidGenerado = '';
    for (let i = 0; i < LONGITUD_ULID; i++) {
        ulidGenerado += caracteresPermitidos[Math.floor(Math.random() * caracteresPermitidos.length)];
    }
    return ulidGenerado;
}

const normalizarIdColumna = (textoColumna) => {
    return textoColumna.replace(/[⬆️⬇️]/g, "")
                       .trim()
                       .toUpperCase()
                       .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("Sistema iniciado...");
    inicializarDatos();

    const tablero = new TableroView();
    const authView = new AuthView();

    const inputBusqueda = document.getElementById("busqueda-codigo");
    const selectEstado = document.getElementById("filtro-estado");

    let usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
    authView.renderAuthButtons(usuarioActivo);

    // --- ESTADO GLOBAL DE ORDENACIÓN ---
    let columnaActivaID = "FECHA-HORA"; 
    let ordenAscendente = true;

    // --- FUNCIÓN MAESTRA: FILTRAR, ORDENAR Y PINTAR ---
    const aplicarFiltros = () => {
        const operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
        const operadoresGuardados = JSON.parse(localStorage.getItem("operadores")) || [];
        const puntosGuardados = JSON.parse(localStorage.getItem("puntos")) || [];
        
        const textoCriterioBusqueda = inputBusqueda.value.trim().toLowerCase();
        const estadoCriterioSeleccionado = selectEstado.value;

        // 1. FILTRADO
        const operacionesFiltradas = operacionesGuardadas.filter(operacion => {
            const coincideCodigo = operacion.codigo.toLowerCase().includes(textoCriterioBusqueda);
            const coincideEstado = estadoCriterioSeleccionado === "TODOS" || operacion.estado === estadoCriterioSeleccionado;
            return coincideCodigo && coincideEstado;
        });

        // 2. SEPARAR POR PANELES
        let listaSalidas = operacionesFiltradas.filter(operacion => operacion.sentido === "salida");
        let listaLlegadas = operacionesFiltradas.filter(operacion => operacion.sentido === "llegada");

        // 3. ORDENACIÓN INDEPENDIENTE
        const ordenarListaOperaciones = (listaOperaciones) => {
            return listaOperaciones.sort((operacionA, operacionB) => {
                let valorOrdenacionA, valorOrdenacionB;
                const idColumnaLimpio = normalizarIdColumna(columnaActivaID);

                switch (idColumnaLimpio) {
                    case "FECHA-HORA":
                    case "FECHAHORA": 
                    case "HORA":
                        // ⏱️ CONVERSIÓN BLINDADA: Transforma cualquier formato (texto o número) a Milisegundos puros
                        valorOrdenacionA = new Date(Number(operacionA.horaProgramada) || operacionA.horaProgramada).getTime();
                        valorOrdenacionB = new Date(Number(operacionB.horaProgramada) || operacionB.horaProgramada).getTime();
                        break;
                    case "CODIGO":
                        valorOrdenacionA = operacionA.codigo.toLowerCase();
                        valorOrdenacionB = operacionB.codigo.toLowerCase();
                        break;
                    case "DESTINO":
                    case "ORIGEN":
                        valorOrdenacionA = (operacionA.sentido === "salida" ? operacionA.destino : operacionA.origen).toLowerCase();
                        valorOrdenacionB = (operacionB.sentido === "salida" ? operacionB.destino : operacionB.origen).toLowerCase();
                        break;
                    case "OPERADOR":
                        valorOrdenacionA = (operadoresGuardados.find(op => op.operadorId === operacionA.operadorId)?.nombre || "").toLowerCase();
                        valorOrdenacionB = (operadoresGuardados.find(op => op.operadorId === operacionB.operadorId)?.nombre || "").toLowerCase();
                        break;
                    case "PUERTA/VIA":
                    case "PUERTA":
                    case "VIA":
                        valorOrdenacionA = (puntosGuardados.find(pt => pt.puntoId === operacionA.puntoId)?.codigo || "").toLowerCase();
                        valorOrdenacionB = (puntosGuardados.find(pt => pt.puntoId === operacionB.puntoId)?.codigo || "").toLowerCase();
                        break;
                    case "ESTADO":
                        valorOrdenacionA = operacionA.estado.toLowerCase();
                        valorOrdenacionB = operacionB.estado.toLowerCase();
                        break;
                    default: return 0;
                }

                if (valorOrdenacionA < valorOrdenacionB) return ordenAscendente ? -1 : 1;
                if (valorOrdenacionA > valorOrdenacionB) return ordenAscendente ? 1 : -1;
                return 0;
            });
        };

        listaSalidas = ordenarListaOperaciones(listaSalidas);
        listaLlegadas = ordenarListaOperaciones(listaLlegadas);

        // 4. PINTADO DE VISTA
        tablero.render(listaSalidas, listaLlegadas, operadoresGuardados, puntosGuardados, usuarioActivo);
        renderizarInterfazAdministracion(usuarioActivo);
    };

    // --- RENDERIZADO DE INTERFAZ CONDICIONAL ---
    const renderizarInterfazAdministracion = (usuarioActual) => {
        const contenedorFiltros = document.querySelector(".filtros");
        const contenedorAuth = document.querySelector(".auth-buttons");
        let infoUsuarioLogueado = document.getElementById("info-usuario-activo");

        if (usuarioActual) {
            if (!infoUsuarioLogueado) {
                infoUsuarioLogueado = document.createElement("span");
                infoUsuarioLogueado.id = "info-usuario-activo";
                infoUsuarioLogueado.style.color = "white";
                infoUsuarioLogueado.style.marginRight = "15px";
                infoUsuarioLogueado.style.alignSelf = "center";
                contenedorAuth.prepend(infoUsuarioLogueado);
            }
            const colorDistintivoRol = usuarioActual.rol === ROL_GESTOR ? "#2ecc71" : "#3498db";
            infoUsuarioLogueado.innerHTML = `👤 ${usuarioActual.email} <strong style="color: ${colorDistintivoRol}; margin-left: 5px;">[${usuarioActual.rol}]</strong>`;
        } else if (infoUsuarioLogueado) {
            infoUsuarioLogueado.remove();
        }

        const alternarBotonAdmin = (idBoton, mostrar, textoBoton, claseEstilo, colorFondoOpcional) => {
            let botonElemento = document.getElementById(idBoton);
            if (mostrar && !botonElemento) {
                botonElemento = document.createElement("button");
                botonElemento.id = idBoton;
                botonElemento.className = claseEstilo;
                botonElemento.style.marginLeft = "10px";
                if(colorFondoOpcional) botonElemento.style.backgroundColor = colorFondoOpcional;
                botonElemento.innerText = textoBoton;
                if(contenedorFiltros) contenedorFiltros.appendChild(botonElemento);
            } else if (!mostrar && botonElemento) {
                botonElemento.remove();
            }
        };

        const tienePermisosGestor = usuarioActual && usuarioActual.rol === ROL_GESTOR;
        alternarBotonAdmin("btn-nueva-operacion", tienePermisosGestor, "➕ Nueva Operación", "btn-primary", "#2ecc71");
        alternarBotonAdmin("btn-gestionar-usuarios", tienePermisosGestor, "👥 Usuarios", "btn-secondary");
        alternarBotonAdmin("btn-gestionar-operadores", tienePermisosGestor, "🏢 Operadores", "btn-secondary");
        alternarBotonAdmin("btn-gestionar-puntos", tienePermisosGestor, "🚪 Puntos", "btn-secondary");
    };

    if(inputBusqueda) inputBusqueda.addEventListener("input", aplicarFiltros);
    if(selectEstado) selectEstado.addEventListener("change", aplicarFiltros);

    /* =========================================
       🔐 LÓGICA DE AUTENTICACIÓN
       ========================================= */
    document.getElementById("btn-login")?.addEventListener("click", () => authView.show(false));
    document.getElementById("btn-signup")?.addEventListener("click", () => authView.show(true));
    document.getElementById("close-modal")?.addEventListener("click", () => authView.hide());

    document.getElementById("auth-form")?.addEventListener("submit", (eventoValidacion) => {
        eventoValidacion.preventDefault();
        const emailIntroducido = document.getElementById("auth-email").value;
        const passwordIntroducida = document.getElementById("auth-password").value;
        const modoFormulario = eventoValidacion.target.dataset.mode;
        const usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];

        if (modoFormulario === "login") {
            const usuarioValido = usuariosGuardados.find(usuario => usuario.email === emailIntroducido && usuario.password === passwordIntroducida);
            if (usuarioValido) {
                sessionStorage.setItem("usuarioActivo", JSON.stringify(usuarioValido));
                usuarioActivo = usuarioValido;
                authView.hide();
                authView.renderAuthButtons(usuarioActivo);
                aplicarFiltros();
            } else {
                alert("Credenciales incorrectas ❌");
            }
        } else {
            if (usuariosGuardados.some(usuario => usuario.email === emailIntroducido)) {
                return alert("El Email introducido ya existe ⚠️");
            }
            if (passwordIntroducida.length <= 8 || !/\d/.test(passwordIntroducida)) {
                return alert("La contraseña debe tener más de 8 caracteres y contener al menos 1 número 🔐");
            }
            
            usuariosGuardados.push(new Usuario(emailIntroducido, passwordIntroducida, ROLES_USUARIO.PUBLICO));
            localStorage.setItem("usuarios", JSON.stringify(usuariosGuardados));
            alert("Cuenta creada con éxito ✅");
            authView.show(false); 
        }
    });

    document.getElementById("btn-logout")?.addEventListener("click", () => {
        sessionStorage.removeItem("usuarioActivo");
        location.reload(); 
    });

    /* =========================================
       ✨ INTERACTIVIDAD TABLA (Delegación Principal)
       ========================================= */
    document.getElementById("close-modal-detalle")?.addEventListener("click", () => document.getElementById("modal-detalle").classList.add("hidden"));

    const tablerosContenedorGlobal = document.querySelector(".tableros-container");
    if(tablerosContenedorGlobal) {
        tablerosContenedorGlobal.addEventListener("click", (eventoClic) => {
            
            // ↕️ CLIC EN CABECERAS PARA ORDENACIÓN
            const cabeceraClicada = eventoClic.target.closest(".tabla-header span") || (eventoClic.target.parentElement?.classList.contains("tabla-header") ? eventoClic.target : null);
            if (cabeceraClicada) {
                const idColumnaClicada = normalizarIdColumna(cabeceraClicada.innerText);
                if (idColumnaClicada === "ACCIONES") return; 

                if (normalizarIdColumna(columnaActivaID) === idColumnaClicada) {
                    ordenAscendente = !ordenAscendente; 
                } else {
                    columnaActivaID = idColumnaClicada; 
                    ordenAscendente = true;
                }

                document.querySelectorAll(".tabla-header span").forEach(cabeceraSpan => {
                    const idCabeceraIterada = normalizarIdColumna(cabeceraSpan.innerText);
                    const textoBaseLimpio = cabeceraSpan.innerText.replace(/[⬆️⬇️]/g, "").trim();
                    if (idCabeceraIterada === idColumnaClicada) {
                        cabeceraSpan.innerText = textoBaseLimpio + (ordenAscendente ? " ⬆️" : " ⬇️");
                    } else {
                        cabeceraSpan.innerText = textoBaseLimpio;
                    }
                });
                aplicarFiltros();
                return;
            }

            // 🗑️ BORRAR OPERACIÓN
            const botonBorrarOperacion = eventoClic.target.closest(".btn-borrar");
            if (botonBorrarOperacion) {
                const idOperacionEliminar = botonBorrarOperacion.getAttribute("data-id");
                if (confirm("⚠️ ¿Deseas borrar definitivamente esta operación?")) {
                    let operacionesExistentes = JSON.parse(localStorage.getItem("operaciones")) || [];
                    localStorage.setItem("operaciones", JSON.stringify(operacionesExistentes.filter(operacion => operacion.operacionId !== idOperacionEliminar)));
                    aplicarFiltros();
                }
                return;
            }

            // ✏️ EDITAR OPERACIÓN
            const botonEditarOperacion = eventoClic.target.closest(".btn-editar");
            if (botonEditarOperacion) {
                const idOperacionEditar = botonEditarOperacion.getAttribute("data-id");
                const operacionesExistentes = JSON.parse(localStorage.getItem("operaciones")) || [];
                const operacionEncontrada = operacionesExistentes.find(operacion => operacion.operacionId === idOperacionEditar);
                
                if (operacionEncontrada) {
                    document.getElementById("op-id").value = operacionEncontrada.operacionId;
                    document.getElementById("op-estado").value = operacionEncontrada.estado;
                    
                    const operadoresExistentes = JSON.parse(localStorage.getItem("operadores")) || [];
                    const puntosExistentes = JSON.parse(localStorage.getItem("puntos")) || [];
                    
                    document.getElementById("op-operador").innerHTML = operadoresExistentes.map(operador => `<option value="${operador.operadorId}" ${operador.operadorId === operacionEncontrada.operadorId ? 'selected' : ''}>${operador.nombre}</option>`).join("");
                    document.getElementById("op-punto").innerHTML = puntosExistentes.map(punto => `<option value="${punto.puntoId}" ${punto.puntoId === operacionEncontrada.puntoId ? 'selected' : ''}>${punto.codigo}</option>`).join("");
                    
                    document.getElementById("modal-operacion")?.classList.remove("hidden");
                }
                return;
            }

            // 🔍 VISTA DETALLE DE OPERACIÓN
            const filaTablaClicada = eventoClic.target.closest(".operacion-row");
            if (filaTablaClicada && !eventoClic.target.closest(".acciones-gestor")) { 
                const idOperacionDetalle = filaTablaClicada.getAttribute("data-id");
                const operacionesExistentes = JSON.parse(localStorage.getItem("operaciones")) || [];
                const operacionEncontrada = operacionesExistentes.find(operacion => operacion.operacionId === idOperacionDetalle);
                
                if (operacionEncontrada) {
                    const operadoresExistentes = JSON.parse(localStorage.getItem("operadores")) || [];
                    const operadorEncontrado = operadoresExistentes.find(operador => operador.operadorId === operacionEncontrada.operadorId);
                    const puntoEncontrado = (JSON.parse(localStorage.getItem("puntos")) || []).find(punto => punto.puntoId === operacionEncontrada.puntoId);
                    
                    const fechaHoraProgramada = new Date(operacionEncontrada.horaProgramada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                    const fechaHoraEstimada = new Date(operacionEncontrada.horaEstimada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

                    document.getElementById("detalle-contenido").innerHTML = `
                        <p>🏷️ <strong>Código:</strong> ${operacionEncontrada.codigo}</p>
                        <p>🚏 <strong>Tipo:</strong> ${operacionEncontrada.tipo.toUpperCase()}</p>
                        <p>🗺️ <strong>Trayecto:</strong> ${operacionEncontrada.origen} ➡️ ${operacionEncontrada.destino}</p>
                        <p>🏢 <strong>Operador:</strong> ${operadorEncontrado ? operadorEncontrado.nombre : 'N/A'}</p>
                        <p>🚪 <strong>Puerta/Vía:</strong> ${puntoEncontrado ? puntoEncontrado.codigo : 'N/A'}</p>
                        <p>🕒 <strong>Hora Programada:</strong> ${fechaHoraProgramada}</p>
                        <p>⏳ <strong>Hora Estimada:</strong> ${fechaHoraEstimada}</p>
                        <p>🚦 <strong>Estado:</strong> <span class="estado-tag state-${operacionEncontrada.estado.toLowerCase()}">${operacionEncontrada.estado}</span></p>
                        <hr style="margin: 15px 0; border: 0; border-top: 1px solid var(--border-color);">
                        <p style="font-size:0.8rem; color:gray;">🔑 <strong>ULID Interno:</strong> ${operacionEncontrada.operacionId}</p>
                    `;
                    document.getElementById("modal-detalle")?.classList.remove("hidden");
                }
            }
        });
    }

    /* =========================================
       ➕ FORMULARIOS DE OPERACIONES
       ========================================= */
    document.getElementById("close-modal-op")?.addEventListener("click", () => document.getElementById("modal-operacion").classList.add("hidden"));
    
    document.getElementById("form-operacion")?.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const idOperacionModificada = document.getElementById("op-id").value;
        let operacionesExistentes = JSON.parse(localStorage.getItem("operaciones")) || [];
        const indiceOperacion = operacionesExistentes.findIndex(operacion => operacion.operacionId === idOperacionModificada);
        
        if (indiceOperacion !== -1) {
            operacionesExistentes[indiceOperacion].estado = document.getElementById("op-estado").value;
            operacionesExistentes[indiceOperacion].operadorId = parseInt(document.getElementById("op-operador").value);
            operacionesExistentes[indiceOperacion].puntoId = parseInt(document.getElementById("op-punto").value);
            localStorage.setItem("operaciones", JSON.stringify(operacionesExistentes));
            document.getElementById("modal-operacion")?.classList.add("hidden");
            aplicarFiltros(); 
        }
    });

    document.getElementById("close-modal-crear")?.addEventListener("click", () => document.getElementById("modal-crear").classList.add("hidden"));

    document.getElementById("form-crear")?.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const codigoIntroducido = document.getElementById("crear-codigo").value;
        const horaIntroducida = new Date(document.getElementById("crear-hora").value).getTime(); 
        if (isNaN(horaIntroducida)) return;

        let operacionesExistentes = JSON.parse(localStorage.getItem("operaciones")) || [];
        const ciudadIntroducida = document.getElementById("crear-ciudad").value;
        const sentidoSeleccionado = document.getElementById("crear-sentido").value;

        operacionesExistentes.push({
            operacionId: generarULID(), 
            tipo: document.getElementById("crear-tipo").value,
            codigo: codigoIntroducido,
            sentido: sentidoSeleccionado,
            origen: sentidoSeleccionado === "llegada" ? ciudadIntroducida : "Madrid", 
            destino: sentidoSeleccionado === "salida" ? ciudadIntroducida : "Madrid",
            horaProgramada: horaIntroducida,
            horaEstimada: horaIntroducida,
            estado: "PROGRAMADO", 
            operadorId: parseInt(document.getElementById("crear-operador").value),
            puntoId: parseInt(document.getElementById("crear-punto").value)
        });
        
        localStorage.setItem("operaciones", JSON.stringify(operacionesExistentes));
        evento.target.reset();
        document.getElementById("modal-crear")?.classList.add("hidden");
        aplicarFiltros();
    });

    /* =========================================
       👥 GESTIÓN DE USUARIOS, OPERADORES Y PUNTOS
       ========================================= */
    document.getElementById("close-modal-usuarios")?.addEventListener("click", () => document.getElementById("modal-usuarios").classList.add("hidden"));
    document.getElementById("close-modal-operadores")?.addEventListener("click", () => document.getElementById("modal-operadores").classList.add("hidden"));
    document.getElementById("close-modal-puntos")?.addEventListener("click", () => document.getElementById("modal-puntos").classList.add("hidden"));

    const renderizarUsuarios = () => {
        const usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];
        const contenedorUsuarios = document.getElementById("lista-usuarios");
        if(contenedorUsuarios) {
            contenedorUsuarios.innerHTML = usuariosGuardados.map(usuario => `
                <article style="display:grid; grid-template-columns:2fr 1fr 1.5fr; padding:10px; border-bottom:1px solid var(--border-color); align-items: center;">
                    <span style="font-weight:bold;">${usuario.email}</span>
                    <span style="color:${usuario.rol === ROL_GESTOR ? '#2ecc71' : '#95a5a6'}; font-size:0.8rem; font-weight:bold;">${usuario.rol}</span>
                    <button class="btn-cambiar-rol" data-email="${usuario.email}" data-rol="${usuario.rol === ROL_GESTOR ? ROL_PUBLICO : ROL_GESTOR}" style="background:#3498db; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Cambiar Rol</button>
                </article>`).join("");
        }
    };

    const renderizarOperadores = () => {
        const operadoresGuardados = JSON.parse(localStorage.getItem("operadores")) || [];
        const contenedorOperadores = document.getElementById("lista-operadores");
        if(contenedorOperadores) {
            contenedorOperadores.innerHTML = operadoresGuardados.map(operador => `
                <article style="display:grid; grid-template-columns:2fr 1fr 1fr; padding:10px; border-bottom:1px solid var(--border-color); align-items: center;">
                    <span style="font-weight:bold;">${operador.nombre}</span>
                    <span>${operador.siglas}</span>
                    <button class="btn-borrar-operador" data-id="${operador.operadorId}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar 🗑️</button>
                </article>`).join("");
        }
    };

    const renderizarPuntos = () => {
        const puntosGuardados = JSON.parse(localStorage.getItem("puntos")) || [];
        const contenedorPuntos = document.getElementById("lista-puntos");
        if(contenedorPuntos) {
            contenedorPuntos.innerHTML = puntosGuardados.map(punto => `
                <article style="display:grid; grid-template-columns:1fr 2fr 1fr; padding:10px; border-bottom:1px solid var(--border-color); align-items: center;">
                    <span style="font-weight:bold;">${punto.tipo}</span>
                    <span>${punto.codigo}</span>
                    <button class="btn-borrar-punto" data-id="${punto.puntoId}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar 🗑️</button>
                </article>`).join("");
        }
    };

    // ESCUCHADOR GLOBAL DE BOTONES DE ADMINISTRACIÓN
    document.body.addEventListener("click", (eventoClic) => {
        
        // --- 1. APERTURA DE MODALES ---
        if (eventoClic.target.closest("#btn-nueva-operacion")) {
            const operadoresExistentes = JSON.parse(localStorage.getItem("operadores")) || [];
            const puntosExistentes = JSON.parse(localStorage.getItem("puntos")) || [];
            const selectorOperadores = document.getElementById("crear-operador");
            const selectorPuntos = document.getElementById("crear-punto");
            
            if(selectorOperadores) selectorOperadores.innerHTML = operadoresExistentes.map(operador => `<option value="${operador.operadorId}">${operador.nombre}</option>`).join("");
            if(selectorPuntos) selectorPuntos.innerHTML = puntosExistentes.map(punto => `<option value="${punto.puntoId}">${punto.codigo}</option>`).join("");
            
            document.getElementById("modal-crear")?.classList.remove("hidden");
        }
        
        if (eventoClic.target.closest("#btn-gestionar-usuarios")) { 
            renderizarUsuarios(); 
            document.getElementById("modal-usuarios")?.classList.remove("hidden"); 
        }
        
        if (eventoClic.target.closest("#btn-gestionar-operadores")) { 
            renderizarOperadores(); 
            document.getElementById("modal-operadores")?.classList.remove("hidden"); 
        }
        
        if (eventoClic.target.closest("#btn-gestionar-puntos")) { 
            renderizarPuntos(); 
            document.getElementById("modal-puntos")?.classList.remove("hidden"); 
        }

        // --- 2. CAMBIAR ROL DE USUARIO ---
        const botonCambiarRol = eventoClic.target.closest(".btn-cambiar-rol");
        if (botonCambiarRol) {
            const emailUsuarioModificado = botonCambiarRol.getAttribute("data-email");
            const nuevoRolAsignado = botonCambiarRol.getAttribute("data-rol");
            let usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];

            if (nuevoRolAsignado === ROL_PUBLICO && usuariosGuardados.filter(usuario => usuario.rol === ROL_GESTOR).length <= 1) {
                return alert("⚠️ ALERTA DE SISTEMA: No puedes degradar al último Gestor disponible.");
            }

            const indiceUsuario = usuariosGuardados.findIndex(usuario => usuario.email === emailUsuarioModificado);
            usuariosGuardados[indiceUsuario].rol = nuevoRolAsignado;
            localStorage.setItem("usuarios", JSON.stringify(usuariosGuardados));

            if (usuarioActivo && emailUsuarioModificado === usuarioActivo.email) {
                usuarioActivo.rol = nuevoRolAsignado;
                sessionStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));
                alert(`Su rol en el sistema ha cambiado a: ${nuevoRolAsignado}. Actualizando la interfaz... 🔄`);
                location.reload(); 
                return;
            }
            renderizarUsuarios(); 
            aplicarFiltros(); 
        }

        // --- 3. BORRAR OPERADORES Y PUNTOS ---
        const botonBorrarOperador = eventoClic.target.closest(".btn-borrar-operador");
        if (botonBorrarOperador) {
            const idOperadorEliminar = parseInt(botonBorrarOperador.getAttribute("data-id"));
            let operadoresGuardados = JSON.parse(localStorage.getItem("operadores")) || [];
            localStorage.setItem("operadores", JSON.stringify(operadoresGuardados.filter(operador => operador.operadorId !== idOperadorEliminar)));
            renderizarOperadores(); 
            aplicarFiltros();
        }
        
        const botonBorrarPunto = eventoClic.target.closest(".btn-borrar-punto");
        if (botonBorrarPunto) {
            const idPuntoEliminar = parseInt(botonBorrarPunto.getAttribute("data-id"));
            let puntosGuardados = JSON.parse(localStorage.getItem("puntos")) || [];
            localStorage.setItem("puntos", JSON.stringify(puntosGuardados.filter(punto => punto.puntoId !== idPuntoEliminar)));
            renderizarPuntos(); 
            aplicarFiltros();
        }
    });

    // Añadir Nuevos Operadores y Puntos
    document.getElementById("form-add-operador")?.addEventListener("submit", (evento) => {
        evento.preventDefault();
        let operadoresGuardados = JSON.parse(localStorage.getItem("operadores")) || [];
        operadoresGuardados.push({ 
            operadorId: Date.now(), 
            nombre: document.getElementById("nuevo-op-nombre").value, 
            siglas: document.getElementById("nuevo-op-siglas").value.toUpperCase(), 
            urlIcono: ICONO_POR_DEFECTO 
        });
        localStorage.setItem("operadores", JSON.stringify(operadoresGuardados));
        evento.target.reset(); 
        renderizarOperadores(); 
        aplicarFiltros();
    });

    document.getElementById("form-add-punto")?.addEventListener("submit", (evento) => {
        evento.preventDefault();
        let puntosGuardados = JSON.parse(localStorage.getItem("puntos")) || [];
        puntosGuardados.push({ 
            puntoId: Date.now(), 
            tipo: document.getElementById("nuevo-pto-tipo").value, 
            codigo: document.getElementById("nuevo-pto-codigo").value.toUpperCase() 
        });
        localStorage.setItem("puntos", JSON.stringify(puntosGuardados));
        evento.target.reset(); 
        renderizarPuntos(); 
        aplicarFiltros();
    });

    // Carga inicial y temporizador de refresco
    aplicarFiltros();
    setInterval(() => { 
        console.log("Refrescando tablero de operaciones... 🔄"); 
        aplicarFiltros(); 
    }, TIEMPO_REFRESCO_MS); 
});