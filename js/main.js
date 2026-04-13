// js/main.js

import { inicializarDatos } from "./data/seed.js";
import { TableroView } from "./views/TableroView.js";
import { AuthView } from "./views/AuthView.js";
import { Usuario, ROLES_USUARIO } from "./models/Usuario.js";

// --- HELPERS ---
function generarULID() {
    const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let ulid = '';
    for (let i = 0; i < 26; i++) {
        ulid += chars[Math.floor(Math.random() * chars.length)];
    }
    return ulid;
}

// Normaliza el ID de la columna para la ordenación (quita tildes y flechas)
const normalizarID = (txt) => {
    return txt.replace(/[⬆️⬇️]/g, "").trim().toUpperCase()
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

    // --- ESTADO DE ORDENACIÓN ---
    let columnaActivaID = "HORA"; 
    let ordenAscendente = true;

    // --- FUNCIÓN MAESTRA: FILTRAR, ORDENAR Y PINTAR ---
    const aplicarFiltros = () => {
        const operacionesActuales = JSON.parse(localStorage.getItem("operaciones")) || [];
        const operadoresAct = JSON.parse(localStorage.getItem("operadores")) || [];
        const puntosAct = JSON.parse(localStorage.getItem("puntos")) || [];
        
        const textoCriterio = inputBusqueda.value.trim().toLowerCase();
        const estadoCriterio = selectEstado.value;

        // 1. FILTRADO
        const filtradas = operacionesActuales.filter(op => {
            const coincideCodigo = op.codigo.toLowerCase().includes(textoCriterio);
            const coincideEstado = estadoCriterio === "TODOS" || op.estado === estadoCriterio;
            return coincideCodigo && coincideEstado;
        });

        // 2. SEPARAR POR PANELES
        let salidas = filtradas.filter(op => op.sentido === "salida");
        let llegadas = filtradas.filter(op => op.sentido === "llegada");

        // 3. ORDENACIÓN INDEPENDIENTE POR PANEL
        const ordenar = (lista) => {
            return lista.sort((a, b) => {
                let valA, valB;
                const ID = normalizarID(columnaActivaID);

                switch (ID) {
                    case "HORA":
                        const d1 = new Date(a.horaProgramada);
                        const d2 = new Date(b.horaProgramada);
                        valA = d1.getHours() * 60 + d1.getMinutes();
                        valB = d2.getHours() * 60 + d2.getMinutes();
                        break;
                    case "CODIGO":
                        valA = a.codigo.toLowerCase();
                        valB = b.codigo.toLowerCase();
                        break;
                    case "DESTINO":
                    case "ORIGEN":
                        valA = (a.sentido === "salida" ? a.destino : a.origen).toLowerCase();
                        valB = (b.sentido === "salida" ? b.destino : b.origen).toLowerCase();
                        break;
                    case "OPERADOR":
                        valA = (operadoresAct.find(o => o.operadorId === a.operadorId)?.nombre || "").toLowerCase();
                        valB = (operadoresAct.find(o => o.operadorId === b.operadorId)?.nombre || "").toLowerCase();
                        break;
                    case "PUERTA/VIA":
                    case "PUERTA":
                    case "VIA":
                        valA = (puntosAct.find(p => p.puntoId === a.puntoId)?.codigo || "").toLowerCase();
                        valB = (puntosAct.find(p => p.puntoId === b.puntoId)?.codigo || "").toLowerCase();
                        break;
                    case "ESTADO":
                        valA = a.estado.toLowerCase();
                        valB = b.estado.toLowerCase();
                        break;
                    default: return 0;
                }

                if (valA < valB) return ordenAscendente ? -1 : 1;
                if (valA > valB) return ordenAscendente ? 1 : -1;
                return 0;
            });
        };

        salidas = ordenar(salidas);
        llegadas = ordenar(llegadas);

        tablero.render(salidas, llegadas, operadoresAct, puntosAct, usuarioActivo);
        renderizarInterfazAdmin(usuarioActivo);
    };

    // --- INTERFAZ DINÁMICA ---
    const renderizarInterfazAdmin = (user) => {
        const contenedorFiltros = document.querySelector(".filtros");
        const contenedorAuth = document.querySelector(".auth-buttons");
        let infoUser = document.getElementById("info-usuario-activo");

        if (user) {
            if (!infoUser) {
                infoUser = document.createElement("span");
                infoUser.id = "info-usuario-activo";
                infoUser.style.color = "white";
                infoUser.style.marginRight = "15px";
                infoUser.style.alignSelf = "center";
                contenedorAuth.prepend(infoUser);
            }
            const colorRol = user.rol === "GESTOR" ? "#2ecc71" : "#3498db";
            infoUser.innerHTML = `👤 ${user.email} <strong style="color: ${colorRol}; margin-left: 5px;">[${user.rol}]</strong>`;
        } else if (infoUser) infoUser.remove();

        const toggleBtn = (id, show, texto, clase, bg) => {
            let btn = document.getElementById(id);
            if (show && !btn) {
                btn = document.createElement("button");
                btn.id = id;
                btn.className = clase;
                btn.style.marginLeft = "10px";
                if(bg) btn.style.backgroundColor = bg;
                btn.innerText = texto;
                contenedorFiltros.appendChild(btn);
            } else if (!show && btn) btn.remove();
        };

        const esGestor = user && user.rol === "GESTOR";
        toggleBtn("btn-nueva-operacion", esGestor, "➕ Nueva Operación", "btn-primary", "#2ecc71");
        toggleBtn("btn-gestionar-usuarios", esGestor, "👥 Usuarios", "btn-secondary");
        toggleBtn("btn-gestionar-operadores", esGestor, "🏢 Operadores", "btn-secondary");
        toggleBtn("btn-gestionar-puntos", esGestor, "🚪 Puntos", "btn-secondary");
    };

    inputBusqueda.addEventListener("input", aplicarFiltros);
    selectEstado.addEventListener("change", aplicarFiltros);

    /* =========================================
       🔐 LÓGICA DE AUTENTICACIÓN
       ========================================= */
    document.getElementById("btn-login").addEventListener("click", () => authView.show(false));
    document.getElementById("btn-signup").addEventListener("click", () => authView.show(true));
    document.getElementById("close-modal").addEventListener("click", () => authView.hide());

    document.getElementById("auth-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("auth-email").value;
        const pass = document.getElementById("auth-password").value;
        const modo = e.target.dataset.mode;
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

        if (modo === "login") {
            const user = usuarios.find(u => u.email === email && u.password === pass);
            if (user) {
                sessionStorage.setItem("usuarioActivo", JSON.stringify(user));
                usuarioActivo = user;
                authView.hide();
                authView.renderAuthButtons(usuarioActivo);
                aplicarFiltros();
            } else alert("Credenciales incorrectas ❌");
        } else {
            if (usuarios.some(u => u.email === email)) return alert("Email ya existe");
            if (pass.length <= 8 || !/\d/.test(pass)) return alert("Contraseña: >8 chars + 1 número");
            usuarios.push(new Usuario(email, pass, ROLES_USUARIO.PUBLICO));
            localStorage.setItem("usuarios", JSON.stringify(usuarios));
            alert("Cuenta creada.");
            authView.show(false); 
        }
    });

    document.getElementById("btn-logout").addEventListener("click", () => {
        sessionStorage.removeItem("usuarioActivo");
        location.reload(); 
    });

    /* =========================================
       ✨ INTERACTIVIDAD TABLA (Delegación)
       ========================================= */
    document.getElementById("close-modal-detalle").addEventListener("click", () => document.getElementById("modal-detalle").classList.add("hidden"));

    document.querySelector(".tableros-container").addEventListener("click", (e) => {
        
        // ↕️ ORDENAR COLUMNAS
        if (e.target.parentElement && e.target.parentElement.classList.contains("tabla-header")) {
            const idClicado = normalizarID(e.target.innerText);
            if (idClicado === "ACCIONES") return; 

            if (normalizarID(columnaActivaID) === idClicado) {
                ordenAscendente = !ordenAscendente;
            } else {
                columnaActivaID = idClicado;
                ordenAscendente = true;
            }

            document.querySelectorAll(".tabla-header span").forEach(span => {
                const esteID = normalizarID(span.innerText);
                const textoOriginal = span.innerText.replace(/[⬆️⬇️]/g, "").trim();
                if (esteID === idClicado) {
                    span.innerText = textoOriginal + (ordenAscendente ? " ⬆️" : " ⬇️");
                } else {
                    span.innerText = textoOriginal;
                }
            });
            
            aplicarFiltros();
            return;
        }

        // 🗑️ BORRAR OPERACIÓN
        if (e.target.classList.contains("btn-borrar")) {
            const id = e.target.getAttribute("data-id");
            if (confirm("¿Borrar definitivamente?")) {
                let ops = JSON.parse(localStorage.getItem("operaciones")) || [];
                localStorage.setItem("operaciones", JSON.stringify(ops.filter(o => o.operacionId !== id)));
                aplicarFiltros();
            }
            return;
        }

        // ✏️ EDITAR OPERACIÓN
        if (e.target.classList.contains("btn-editar")) {
            const id = e.target.getAttribute("data-id");
            const ops = JSON.parse(localStorage.getItem("operaciones")) || [];
            const op = ops.find(o => o.operacionId === id);
            if (op) {
                document.getElementById("op-id").value = op.operacionId;
                document.getElementById("op-estado").value = op.estado;
                const opers = JSON.parse(localStorage.getItem("operadores")) || [];
                const pts = JSON.parse(localStorage.getItem("puntos")) || [];
                document.getElementById("op-operador").innerHTML = opers.map(o => `<option value="${o.operadorId}" ${o.operadorId === op.operadorId ? 'selected' : ''}>${o.nombre}</option>`).join("");
                document.getElementById("op-punto").innerHTML = pts.map(p => `<option value="${p.puntoId}" ${p.puntoId === op.puntoId ? 'selected' : ''}>${p.codigo}</option>`).join("");
                document.getElementById("modal-operacion").classList.remove("hidden");
            }
            return;
        }

        // 🔍 VISTA DETALLE
        const fila = e.target.closest(".operacion-row");
        if (fila && !e.target.closest(".acciones-gestor")) { 
            const id = fila.getAttribute("data-id");
            const ops = JSON.parse(localStorage.getItem("operaciones")) || [];
            const op = ops.find(o => o.operacionId === id);
            if (op) {
                const opers = JSON.parse(localStorage.getItem("operadores")) || [];
                const oper = opers.find(o => o.operadorId === op.operadorId);
                const pto = (JSON.parse(localStorage.getItem("puntos")) || []).find(p => p.puntoId === op.puntoId);
                document.getElementById("detalle-contenido").innerHTML = `
                    <p>🏷️ <strong>Código:</strong> ${op.codigo}</p>
                    <p>🏢 <strong>Operador:</strong> ${oper ? oper.nombre : 'N/A'}</p>
                    <p>🚦 <strong>Estado:</strong> ${op.estado}</p>
                    <p>🚪 <strong>Punto:</strong> ${pto ? pto.codigo : '---'}</p>
                    <hr><p style="font-size:0.7rem;">ID Interno: ${op.operacionId}</p>
                `;
                document.getElementById("modal-detalle").classList.remove("hidden");
            }
        }
    });

    /* =========================================
       ➕ FORMULARIOS Y GESTIÓN
       ========================================= */

    document.getElementById("close-modal-op").addEventListener("click", () => document.getElementById("modal-operacion").classList.add("hidden"));
    
    document.getElementById("form-operacion").addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById("op-id").value;
        let ops = JSON.parse(localStorage.getItem("operaciones")) || [];
        const idx = ops.findIndex(o => o.operacionId === id);
        if (idx !== -1) {
            ops[idx].estado = document.getElementById("op-estado").value;
            ops[idx].operadorId = parseInt(document.getElementById("op-operador").value);
            ops[idx].puntoId = parseInt(document.getElementById("op-punto").value);
            localStorage.setItem("operaciones", JSON.stringify(ops));
            document.getElementById("modal-operacion").classList.add("hidden");
            aplicarFiltros(); 
        }
    });

    const modalCrear = document.getElementById("modal-crear");
    document.getElementById("close-modal-crear").addEventListener("click", () => modalCrear.classList.add("hidden"));

    document.getElementById("form-crear").addEventListener("submit", (e) => {
        e.preventDefault();
        const codigo = document.getElementById("crear-codigo").value;
        const hora = new Date(document.getElementById("crear-hora").value).getTime(); 
        if (isNaN(hora)) return;

        let ops = JSON.parse(localStorage.getItem("operaciones")) || [];
        const ciudad = document.getElementById("crear-ciudad").value;
        const sentido = document.getElementById("crear-sentido").value;

        ops.push({
            operacionId: generarULID(), 
            tipo: document.getElementById("crear-tipo").value,
            codigo: codigo,
            sentido: sentido,
            origen: sentido === "llegada" ? ciudad : "Madrid", 
            destino: sentido === "salida" ? ciudad : "Madrid",
            horaProgramada: hora,
            horaEstimada: hora,
            estado: "PROGRAMADO", 
            operadorId: parseInt(document.getElementById("crear-operador").value),
            puntoId: parseInt(document.getElementById("crear-punto").value)
        });
        localStorage.setItem("operaciones", JSON.stringify(ops));
        e.target.reset();
        modalCrear.classList.add("hidden");
        aplicarFiltros();
    });

    /* =========================================
       👥 GESTIÓN DE USUARIOS (Con fix de sesión)
       ========================================= */
    const modUsr = document.getElementById("modal-usuarios");
    document.getElementById("close-modal-usuarios").addEventListener("click", () => modUsr.classList.add("hidden"));

    const renderUsr = () => {
        const u = JSON.parse(localStorage.getItem("usuarios")) || [];
        document.getElementById("lista-usuarios").innerHTML = u.map(usr => `
            <div style="display:grid; grid-template-columns:2fr 1fr 1.5fr; padding:10px; border-bottom:1px solid #444;">
                <span>${usr.email}</span><span style="color:#2ecc71">${usr.rol}</span>
                <button class="btn-cambiar-rol" data-email="${usr.email}" data-rol="${usr.rol === 'GESTOR' ? 'PÚBLICO' : 'GESTOR'}" style="background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;">🔄</button>
            </div>`).join("");
    };

    document.body.addEventListener("click", (e) => {
        if (e.target.id === "btn-gestionar-usuarios") { renderUsr(); modUsr.classList.remove("hidden"); }

        if (e.target.classList.contains("btn-cambiar-rol")) {
            const email = e.target.getAttribute("data-email");
            const nuevo = e.target.getAttribute("data-rol");
            let u = JSON.parse(localStorage.getItem("usuarios")) || [];

            if (nuevo === "PÚBLICO" && u.filter(x => x.rol === "GESTOR").length <= 1) {
                return alert("⚠️ No puedes degradar al último Gestor.");
            }

            const idx = u.findIndex(x => x.email === email);
            u[idx].rol = nuevo;
            localStorage.setItem("usuarios", JSON.stringify(u));

            // 🔑 SINCRONIZACIÓN DE SESIÓN (Evita el fantasma)
            if (usuarioActivo && email === usuarioActivo.email) {
                usuarioActivo.rol = nuevo;
                sessionStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));
                if (nuevo === "PÚBLICO") {
                    alert("Has perdido tus permisos de gestor.");
                    location.reload(); 
                    return;
                }
            }
            renderUsr(); 
            aplicarFiltros(); 
        }
    });

    // Gestión de Operadores y Puntos (Formularios)
    document.getElementById("form-add-operador").addEventListener("submit", (e) => {
        e.preventDefault();
        let o = JSON.parse(localStorage.getItem("operadores")) || [];
        o.push({ operadorId: Date.now(), nombre: document.getElementById("nuevo-op-nombre").value, siglas: document.getElementById("nuevo-op-siglas").value.toUpperCase() });
        localStorage.setItem("operadores", JSON.stringify(o));
        e.target.reset(); renderOpr(); aplicarFiltros();
    });

    document.getElementById("form-add-punto").addEventListener("submit", (e) => {
        e.preventDefault();
        let p = JSON.parse(localStorage.getItem("puntos")) || [];
        p.push({ puntoId: Date.now(), tipo: document.getElementById("nuevo-pto-tipo").value, codigo: document.getElementById("nuevo-pto-codigo").value.toUpperCase() });
        localStorage.setItem("puntos", JSON.stringify(p));
        e.target.reset(); renderPto(); aplicarFiltros();
    });

    // Carga inicial y timer
    aplicarFiltros();
    setInterval(() => { console.log("Refrescando tablero..."); aplicarFiltros(); }, 60000); 
});