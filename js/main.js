// js/main.js

import { inicializarDatos } from "./data/seed.js";
import { TableroView } from "./views/TableroView.js";
import { AuthView } from "./views/AuthView.js";
import { Usuario, ROLES_USUARIO } from "./models/Usuario.js";

function generarULID() {
    const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let ulid = '';
    for (let i = 0; i < 26; i++) {
        ulid += chars[Math.floor(Math.random() * chars.length)];
    }
    return ulid;
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Sistema iniciado...");
    inicializarDatos();

    const tablero = new TableroView();
    const authView = new AuthView();

    const inputBusqueda = document.getElementById("busqueda-codigo");
    const selectEstado = document.getElementById("filtro-estado");

    let usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
    authView.renderAuthButtons(usuarioActivo);

    let columnaOrden = null;
    let ordenAscendente = true;

    // 2. Función maestra
    const aplicarFiltros = () => {
        let operacionesActuales = JSON.parse(localStorage.getItem("operaciones")) || [];
        let operadoresAct = JSON.parse(localStorage.getItem("operadores")) || [];
        let puntosAct = JSON.parse(localStorage.getItem("puntos")) || [];
        
        const textoCriterio = inputBusqueda.value.toLowerCase();
        const estadoCriterio = selectEstado.value;

        // FILTRAR
        let operacionesFiltradas = operacionesActuales.filter(op => {
            const coincideCodigo = op.codigo.toLowerCase().includes(textoCriterio);
            const coincideEstado = estadoCriterio === "TODOS" || op.estado === estadoCriterio;
            return coincideCodigo && coincideEstado;
        });

        // ORDENAR ↕️
        if (columnaOrden) {
            operacionesFiltradas.sort((a, b) => {
                let valA = "", valB = "";
                switch(columnaOrden.toLowerCase()) {
                    case "hora": valA = a.horaProgramada; valB = b.horaProgramada; break;
                    case "código": 
                    case "codigo": valA = a.codigo.toLowerCase(); valB = b.codigo.toLowerCase(); break;
                    case "destino": 
                    case "origen": 
                        valA = (a.sentido === "salida" ? a.destino : a.origen).toLowerCase(); 
                        valB = (b.sentido === "salida" ? b.destino : b.origen).toLowerCase(); 
                        break;
                    case "estado": valA = a.estado.toLowerCase(); valB = b.estado.toLowerCase(); break;
                }
                if (valA < valB) return ordenAscendente ? -1 : 1;
                if (valA > valB) return ordenAscendente ? 1 : -1;
                return 0;
            });
        }

        // PINTAR TABLA
        tablero.render(operacionesFiltradas, operadoresAct, puntosAct, usuarioActivo);

        // BOTONES DE GESTIÓN Y NOMBRE DE USUARIO
        const contenedorFiltros = document.querySelector(".filtros");
        const contenedorAuth = document.querySelector(".auth-buttons");
        
        let infoUser = document.getElementById("info-usuario-activo");
        if (usuarioActivo) {
            if (!infoUser) {
                infoUser = document.createElement("span");
                infoUser.id = "info-usuario-activo";
                infoUser.style.color = "white";
                infoUser.style.marginRight = "15px";
                infoUser.style.alignSelf = "center";
                contenedorAuth.prepend(infoUser);
            }
            const colorRol = usuarioActivo.rol === "GESTOR" ? "#2ecc71" : "#3498db";
            infoUser.innerHTML = `👤 ${usuarioActivo.email} <strong style="color: ${colorRol}; margin-left: 5px;">[${usuarioActivo.rol}]</strong>`;
        } else {
            if (infoUser) infoUser.remove();
        }

        // Crear botones de gestor si no existen
        const crearBoton = (id, texto, colorClase, margen) => {
            let btn = document.getElementById(id);
            if (!btn) {
                btn = document.createElement("button");
                btn.id = id;
                btn.className = colorClase;
                btn.style.marginLeft = margen;
                btn.innerText = texto;
                contenedorFiltros.appendChild(btn);
            }
            return btn;
        };

        if (usuarioActivo && usuarioActivo.rol === "GESTOR") {
            const btnNuevo = crearBoton("btn-nueva-operacion", "➕ Nueva Operación", "btn-primary", "15px");
            btnNuevo.style.backgroundColor = "#2ecc71";
            crearBoton("btn-gestionar-usuarios", "👥 Usuarios", "btn-secondary", "10px");
            crearBoton("btn-gestionar-operadores", "🏢 Operadores", "btn-secondary", "10px");
            crearBoton("btn-gestionar-puntos", "🚪 Puntos", "btn-secondary", "10px");
        } else {
            const ids = ["btn-nueva-operacion", "btn-gestionar-usuarios", "btn-gestionar-operadores", "btn-gestionar-puntos"];
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
        }
    };

    inputBusqueda.addEventListener("input", aplicarFiltros);
    selectEstado.addEventListener("change", aplicarFiltros);
    aplicarFiltros(); 

    /* =========================================
       🔐 LÓGICA DE LOGIN Y REGISTRO
       ========================================= */

    document.getElementById("btn-login").addEventListener("click", () => authView.show(false));
    document.getElementById("btn-signup").addEventListener("click", () => authView.show(true));
    document.getElementById("close-modal").addEventListener("click", () => authView.hide());

    document.getElementById("auth-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("auth-email").value;
        const pass = document.getElementById("auth-password").value;
        const modo = e.target.dataset.mode;
        const usuariosCargados = JSON.parse(localStorage.getItem("usuarios")) || [];

        if (modo === "login") {
            const user = usuariosCargados.find(u => u.email === email && u.password === pass);
            if (user) {
                sessionStorage.setItem("usuarioActivo", JSON.stringify(user));
                usuarioActivo = user;
                authView.hide();
                authView.renderAuthButtons(usuarioActivo);
                aplicarFiltros();
            } else {
                alert("Credenciales incorrectas ❌");
            }
        } else {
            if (usuariosCargados.some(u => u.email === email)) { alert("Ese email ya existe 📧"); return; }
            const tieneNumero = /\d/.test(pass);
            const esLarga = pass.length > 8;
            if (!esLarga || !tieneNumero) { alert("⚠️ La contraseña debe tener más de 8 caracteres y contener al menos un número."); return; }
            
            usuariosCargados.push(new Usuario(email, pass, ROLES_USUARIO.PUBLICO));
            localStorage.setItem("usuarios", JSON.stringify(usuariosCargados));
            alert("Cuenta creada. Ahora puedes loguearte.");
            authView.show(false); 
        }
    });

    document.getElementById("btn-logout").addEventListener("click", () => {
        sessionStorage.removeItem("usuarioActivo");
        usuarioActivo = null;
        authView.renderAuthButtons(null);
        location.reload(); 
    });

    /* =========================================
       ✨ INTERACTIVIDAD DE LA TABLA (Delegación global)
       ========================================= */
    
    document.getElementById("close-modal-detalle").addEventListener("click", () => document.getElementById("modal-detalle").classList.add("hidden"));

    document.querySelector(".tableros-container").addEventListener("click", (e) => {
        
        // ↕️ ORDENAR
        if (e.target.parentElement && e.target.parentElement.classList.contains("tabla-header")) {
            const columnaTexto = e.target.innerText.replace(" ⬆️", "").replace(" ⬇️", "").trim();
            if (columnaTexto === "Acciones" || columnaTexto === "Operador" || columnaTexto === "Puerta/Vía") return; 
            if (columnaOrden === columnaTexto) { ordenAscendente = !ordenAscendente; } 
            else { columnaOrden = columnaTexto; ordenAscendente = true; }

            document.querySelectorAll(".tabla-header span").forEach(span => { span.innerText = span.innerText.replace(" ⬆️", "").replace(" ⬇️", "").trim(); });
            e.target.innerText = columnaTexto + (ordenAscendente ? " ⬆️" : " ⬇️");
            aplicarFiltros();
            return; 
        }

        // 🗑️ BORRAR OPERACIÓN
        if (e.target.classList.contains("btn-borrar")) {
            const idOperacion = e.target.getAttribute("data-id");
            if (confirm("⚠️ ¿Estás seguro de que quieres eliminar esta operación?")) {
                let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
                localStorage.setItem("operaciones", JSON.stringify(operacionesGuardadas.filter(op => op.operacionId !== idOperacion)));
                aplicarFiltros();
            }
            return;
        }

        // ✏️ EDITAR OPERACIÓN
        if (e.target.classList.contains("btn-editar")) {
            const idOperacion = e.target.getAttribute("data-id");
            let opsGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
            const opToEdit = opsGuardadas.find(op => op.operacionId === idOperacion);

            if (opToEdit) {
                document.getElementById("op-id").value = opToEdit.operacionId;
                document.getElementById("op-estado").value = opToEdit.estado;
                
                let opAct = JSON.parse(localStorage.getItem("operadores")) || [];
                let ptAct = JSON.parse(localStorage.getItem("puntos")) || [];

                document.getElementById("op-operador").innerHTML = opAct.map(o => `<option value="${o.operadorId}" ${o.operadorId === opToEdit.operadorId ? 'selected' : ''}>${o.nombre}</option>`).join("");
                document.getElementById("op-punto").innerHTML = ptAct.map(p => `<option value="${p.puntoId}" ${p.puntoId === opToEdit.puntoId ? 'selected' : ''}>${p.codigo}</option>`).join("");

                document.getElementById("modal-operacion").classList.remove("hidden");
            }
            return;
        }

        // 🔍 VISTA DETALLE
        const fila = e.target.closest(".operacion-row");
        if (fila && !e.target.closest(".acciones-gestor")) { 
            const idOperacion = fila.getAttribute("data-id");
            let opsGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
            const op = opsGuardadas.find(o => o.operacionId === idOperacion);
            
            if (op) {
                let opAct = JSON.parse(localStorage.getItem("operadores")) || [];
                let ptAct = JSON.parse(localStorage.getItem("puntos")) || [];
                const operador = opAct.find(o => o.operadorId === op.operadorId);
                const punto = ptAct.find(p => p.puntoId === op.puntoId);
                
                const horaProg = new Date(op.horaProgramada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                const horaEst = new Date(op.horaEstimada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

                document.getElementById("detalle-contenido").innerHTML = `
                    <p>🏷️ <strong>Código:</strong> ${op.codigo}</p>
                    <p>🚏 <strong>Tipo:</strong> ${op.tipo.toUpperCase()}</p>
                    <p>🗺️ <strong>Trayecto:</strong> ${op.origen} ➡️ ${op.destino}</p>
                    <p>🏢 <strong>Operador:</strong> ${operador ? operador.nombre : 'N/A'}</p>
                    <p>🚪 <strong>Puerta/Vía:</strong> ${punto ? punto.codigo : 'N/A'}</p>
                    <p>🕒 <strong>Hora Programada:</strong> ${horaProg}</p>
                    <p>⏳ <strong>Hora Estimada:</strong> ${horaEst}</p>
                    <p>🚦 <strong>Estado:</strong> <span class="estado-tag state-${op.estado.toLowerCase()}">${op.estado}</span></p>
                    <hr style="margin: 15px 0; border: 0; border-top: 1px solid var(--border-color);">
                    <p style="font-size:0.8rem; color:gray;">🔑 <strong>ULID Interno:</strong> ${op.operacionId}</p>
                `;
                document.getElementById("modal-detalle").classList.remove("hidden");
            }
        }
    });

    /* =========================================
       ➕ GUARDAR MODALES (Operaciones)
       ========================================= */

    document.getElementById("close-modal-op").addEventListener("click", () => document.getElementById("modal-operacion").classList.add("hidden"));
    
    // Guardar Edición Operación
    document.getElementById("form-operacion").addEventListener("submit", (e) => {
        e.preventDefault();
        const idEditado = document.getElementById("op-id").value;
        let ops = JSON.parse(localStorage.getItem("operaciones")) || [];
        const index = ops.findIndex(op => op.operacionId === idEditado);

        if (index !== -1) {
            ops[index].estado = document.getElementById("op-estado").value;
            ops[index].operadorId = parseInt(document.getElementById("op-operador").value);
            ops[index].puntoId = parseInt(document.getElementById("op-punto").value);
            localStorage.setItem("operaciones", JSON.stringify(ops));
            document.getElementById("modal-operacion").classList.add("hidden");
            aplicarFiltros(); 
        }
    });

    const modalCrear = document.getElementById("modal-crear");
    document.getElementById("close-modal-crear").addEventListener("click", () => modalCrear.classList.add("hidden"));
    document.getElementById("crear-sentido").addEventListener("change", (e) => { document.getElementById("label-ciudad").innerText = e.target.value === "salida" ? "Destino" : "Origen"; });

    // Guardar Nueva Operación
    document.getElementById("form-crear").addEventListener("submit", (e) => {
        e.preventDefault();
        const codigo = document.getElementById("crear-codigo").value;
        const sentido = document.getElementById("crear-sentido").value;
        const ciudad = document.getElementById("crear-ciudad").value;
        const hora = new Date(document.getElementById("crear-hora").value).getTime(); 

        if (isNaN(hora)) { alert("Por favor, selecciona una fecha válida."); return; }

        let ops = JSON.parse(localStorage.getItem("operaciones")) || [];
        if(ops.some(op => op.codigo.toUpperCase() === codigo.toUpperCase())) { alert("⚠️ Ya existe ese código."); return; }

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
        document.getElementById("form-crear").reset();
        modalCrear.classList.add("hidden");
        aplicarFiltros();
    });


    /* =========================================
       🏢🚪👥 GESTIÓN DE USUARIOS, OPERADORES Y PUNTOS
       ========================================= */

    const modalUsuarios = document.getElementById("modal-usuarios");
    const modalOps = document.getElementById("modal-operadores");
    const modalPuntos = document.getElementById("modal-puntos");

    document.getElementById("close-modal-usuarios").addEventListener("click", () => modalUsuarios.classList.add("hidden"));
    document.getElementById("close-modal-operadores").addEventListener("click", () => modalOps.classList.add("hidden"));
    document.getElementById("close-modal-puntos").addEventListener("click", () => modalPuntos.classList.add("hidden"));

    const renderizarUsuarios = () => {
        let uGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];
        document.getElementById("lista-usuarios").innerHTML = uGuardados.map(u => {
            let btn = u.rol === "GESTOR" 
                ? `<button class="btn-cambiar-rol" data-email="${u.email}" data-rol="PÚBLICO" style="background:#e74c3c;color:white;padding:6px;border:none;border-radius:4px;cursor:pointer;width:100%;">Degradar ⬇️</button>`
                : `<button class="btn-cambiar-rol" data-email="${u.email}" data-rol="GESTOR" style="background:#3498db;color:white;padding:6px;border:none;border-radius:4px;cursor:pointer;width:100%;">Ascender ⬆️</button>`;
            return `<div style="display:grid; grid-template-columns:2fr 1fr 1.5fr; padding:12px; border-bottom:1px solid var(--border-color); align-items:center;">
                <span style="font-weight:bold;">${u.email}</span><span style="color:${u.rol==="GESTOR"?"#2ecc71":"#95a5a6"};font-weight:bold;font-size:0.8rem;">${u.rol}</span><div>${btn}</div></div>`;
        }).join("");
    };

    const renderizarOperadores = () => {
        let ops = JSON.parse(localStorage.getItem("operadores")) || [];
        document.getElementById("lista-operadores").innerHTML = ops.map(o => `
            <div style="display:grid; grid-template-columns:2fr 1fr 1fr; padding:12px; border-bottom:1px solid var(--border-color); align-items:center;">
                <span style="font-weight:bold;">${o.nombre}</span><span>${o.siglas}</span>
                <button class="btn-borrar-operador" data-id="${o.operadorId}" style="background:#e74c3c;color:white;padding:6px;border:none;border-radius:4px;cursor:pointer;">Borrar 🗑️</button></div>`).join("");
    };

    const renderizarPuntos = () => {
        let pts = JSON.parse(localStorage.getItem("puntos")) || [];
        document.getElementById("lista-puntos").innerHTML = pts.map(p => `
            <div style="display:grid; grid-template-columns:1fr 2fr 1fr; padding:12px; border-bottom:1px solid var(--border-color); align-items:center;">
                <span style="font-weight:bold;">${p.tipo}</span><span>${p.codigo}</span>
                <button class="btn-borrar-punto" data-id="${p.puntoId}" style="background:#e74c3c;color:white;padding:6px;border:none;border-radius:4px;cursor:pointer;">Borrar 🗑️</button></div>`).join("");
    };

    document.body.addEventListener("click", (e) => {
        // Abrir modales Gestor
        if (e.target.id === "btn-nueva-operacion") {
            let opAct = JSON.parse(localStorage.getItem("operadores")) || [];
            let ptAct = JSON.parse(localStorage.getItem("puntos")) || [];
            document.getElementById("crear-operador").innerHTML = opAct.map(o => `<option value="${o.operadorId}">${o.nombre}</option>`).join("");
            document.getElementById("crear-punto").innerHTML = ptAct.map(p => `<option value="${p.puntoId}">${p.codigo}</option>`).join("");
            modalCrear.classList.remove("hidden");
        }
        if (e.target.id === "btn-gestionar-usuarios") { renderizarUsuarios(); modalUsuarios.classList.remove("hidden"); }
        if (e.target.id === "btn-gestionar-operadores") { renderizarOperadores(); modalOps.classList.remove("hidden"); }
        if (e.target.id === "btn-gestionar-puntos") { renderizarPuntos(); modalPuntos.classList.remove("hidden"); }

        // Borrar Entidades Secundarias
        if (e.target.classList.contains("btn-borrar-operador")) {
            const id = parseInt(e.target.getAttribute("data-id"));
            let ops = JSON.parse(localStorage.getItem("operadores")) || [];
            localStorage.setItem("operadores", JSON.stringify(ops.filter(o => o.operadorId !== id)));
            renderizarOperadores(); aplicarFiltros();
        }
        if (e.target.classList.contains("btn-borrar-punto")) {
            const id = parseInt(e.target.getAttribute("data-id"));
            let pts = JSON.parse(localStorage.getItem("puntos")) || [];
            localStorage.setItem("puntos", JSON.stringify(pts.filter(p => p.puntoId !== id)));
            renderizarPuntos(); aplicarFiltros();
        }

        // Ascender/Degradar Usuarios
        if (e.target.classList.contains("btn-cambiar-rol")) {
            const email = e.target.getAttribute("data-email");
            const nuevoRol = e.target.getAttribute("data-rol");
            let uGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];
            if (nuevoRol === "PÚBLICO" && uGuardados.filter(u => u.rol === "GESTOR").length <= 1) { alert("⚠️ No puedes degradar al último Gestor."); return; }
            const index = uGuardados.findIndex(u => u.email === email);
            if (index !== -1) {
                uGuardados[index].rol = nuevoRol;
                localStorage.setItem("usuarios", JSON.stringify(uGuardados));
                if (email === usuarioActivo.email && nuevoRol === "PÚBLICO") { document.getElementById("btn-logout").click(); return; }
                renderizarUsuarios(); 
            }
        }
    });

    // Añadir Operador y Punto
    document.getElementById("form-add-operador").addEventListener("submit", (e) => {
        e.preventDefault();
        let ops = JSON.parse(localStorage.getItem("operadores")) || [];
        const nuevoId = ops.length > 0 ? Math.max(...ops.map(o => o.operadorId)) + 1 : 1;
        ops.push({
            operadorId: nuevoId,
            nombre: document.getElementById("nuevo-op-nombre").value,
            siglas: document.getElementById("nuevo-op-siglas").value.toUpperCase(),
            color: "#FFFFFF",
            urlIcono: "https://cdn-icons-png.flaticon.com/512/782/782073.png"
        });
        localStorage.setItem("operadores", JSON.stringify(ops));
        document.getElementById("form-add-operador").reset();
        renderizarOperadores(); aplicarFiltros();
    });

    document.getElementById("form-add-punto").addEventListener("submit", (e) => {
        e.preventDefault();
        let pts = JSON.parse(localStorage.getItem("puntos")) || [];
        const nuevoId = pts.length > 0 ? Math.max(...pts.map(p => p.puntoId)) + 1 : 1;
        pts.push({
            puntoId: nuevoId,
            tipo: document.getElementById("nuevo-pto-tipo").value,
            codigo: document.getElementById("nuevo-pto-codigo").value.toUpperCase()
        });
        localStorage.setItem("puntos", JSON.stringify(pts));
        document.getElementById("form-add-punto").reset();
        renderizarPuntos(); aplicarFiltros();
    });

    // Piloto Automático
    setInterval(() => { console.log("⏱️ Refrescando..."); aplicarFiltros(); }, 60000); 
});