// js/main.js

import { inicializarDatos } from "./data/seed.js";
import { TableroView } from "./views/TableroView.js";
import { AuthView } from "./views/AuthView.js";
import { Usuario, ROLES_USUARIO } from "./models/Usuario.js";

// Función ULID
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

    const operadores = JSON.parse(localStorage.getItem("operadores")) || [];
    const puntos = JSON.parse(localStorage.getItem("puntos")) || [];

    const tablero = new TableroView();
    const authView = new AuthView();

    const inputBusqueda = document.getElementById("busqueda-codigo");
    const selectEstado = document.getElementById("filtro-estado");

    let usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
    authView.renderAuthButtons(usuarioActivo);

    // 🆕 VARIABLES DE ORDENACIÓN
    let columnaOrden = null;
    let ordenAscendente = true;

    // 2. Función maestra (Filtra, Ordena y Pinta)
    const aplicarFiltros = () => {
        let operacionesActuales = JSON.parse(localStorage.getItem("operaciones")) || [];
        const textoCriterio = inputBusqueda.value.toLowerCase();
        const estadoCriterio = selectEstado.value;

        // A. FILTRAR
        let operacionesFiltradas = operacionesActuales.filter(op => {
            const coincideCodigo = op.codigo.toLowerCase().includes(textoCriterio);
            const coincideEstado = estadoCriterio === "TODOS" || op.estado === estadoCriterio;
            return coincideCodigo && coincideEstado;
        });

        // B. ORDENAR ↕️
        if (columnaOrden) {
            operacionesFiltradas.sort((a, b) => {
                let valA = "", valB = "";
                
                // Forzamos minúsculas para evitar el problema de las mayúsculas del CSS
                switch(columnaOrden.toLowerCase()) {
                    case "hora": 
                        valA = a.horaProgramada; 
                        valB = b.horaProgramada; 
                        break;
                    case "código": 
                    case "codigo": 
                        valA = a.codigo.toLowerCase(); 
                        valB = b.codigo.toLowerCase(); 
                        break;
                    case "destino": 
                    case "origen": 
                        valA = (a.sentido === "salida" ? a.destino : a.origen).toLowerCase(); 
                        valB = (b.sentido === "salida" ? b.destino : b.origen).toLowerCase(); 
                        break;
                    case "estado": 
                        valA = a.estado.toLowerCase(); 
                        valB = b.estado.toLowerCase(); 
                        break;
                }
                
                if (valA < valB) return ordenAscendente ? -1 : 1;
                if (valA > valB) return ordenAscendente ? 1 : -1;
                return 0;
            });
        }

        // C. PINTAR
        tablero.render(operacionesFiltradas, operadores, puntos, usuarioActivo);

        // Botones de Gestor
        const contenedorFiltros = document.querySelector(".filtros");
        let btnNuevo = document.getElementById("btn-nueva-operacion");
        let btnUsuarios = document.getElementById("btn-gestionar-usuarios");
        
        if (usuarioActivo && usuarioActivo.rol === "GESTOR") {
            if (!btnNuevo) {
                btnNuevo = document.createElement("button");
                btnNuevo.id = "btn-nueva-operacion";
                btnNuevo.className = "btn-primary";
                btnNuevo.style.marginLeft = "15px";
                btnNuevo.style.backgroundColor = "#2ecc71";
                btnNuevo.innerText = "➕ Nueva Operación";
                contenedorFiltros.appendChild(btnNuevo);
            }
            if (!btnUsuarios) {
                btnUsuarios = document.createElement("button");
                btnUsuarios.id = "btn-gestionar-usuarios";
                btnUsuarios.className = "btn-secondary";
                btnUsuarios.style.marginLeft = "10px";
                btnUsuarios.innerText = "👥 Usuarios";
                contenedorFiltros.appendChild(btnUsuarios);
            }
        } else {
            if (btnNuevo) btnNuevo.remove();
            if (btnUsuarios) btnUsuarios.remove();
        }

        // 🆕 Mostrar email y rol del usuario logueado en la cabecera
        let infoUser = document.getElementById("info-usuario-activo");
        const contenedorAuth = document.querySelector(".auth-buttons");
        
        if (usuarioActivo) {
            if (!infoUser) {
                infoUser = document.createElement("span");
                infoUser.id = "info-usuario-activo";
                infoUser.style.color = "white";
                infoUser.style.marginRight = "15px";
                infoUser.style.alignSelf = "center";
                contenedorAuth.prepend(infoUser);
            }
            // Pintamos el email y el rol destacado en verde o azul
            const colorRol = usuarioActivo.rol === "GESTOR" ? "#2ecc71" : "#3498db";
            infoUser.innerHTML = `👤 ${usuarioActivo.email} <strong style="color: ${colorRol}; margin-left: 5px;">[${usuarioActivo.rol}]</strong>`;
        } else {
            if (infoUser) infoUser.remove();
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
                alert("¡Bienvenido!");
                aplicarFiltros();
            } else {
                alert("Credenciales incorrectas ❌");
            }
        } else {
            if (usuariosCargados.some(u => u.email === email)) {
                alert("Ese email ya existe 📧");
                return;
            }
            // Validaciones
            const tieneNumero = /\d/.test(pass);
            const esLarga = pass.length > 8;
            if (!esLarga || !tieneNumero) {
                alert("⚠️ La contraseña debe tener más de 8 caracteres y contener al menos un número.");
                return;
            }
            const nuevoUsuario = new Usuario(email, pass, ROLES_USUARIO.PUBLICO);
            usuariosCargados.push(nuevoUsuario);
            localStorage.setItem("usuarios", JSON.stringify(usuariosCargados));
            alert("Cuenta creada. Ahora puedes loguearte.");
            authView.show(false); 
        }
    });

    document.getElementById("btn-logout").addEventListener("click", () => {
        sessionStorage.removeItem("usuarioActivo");
        usuarioActivo = null;
        authView.renderAuthButtons(null);
        alert("Sesión cerrada 👋");
        location.reload(); 
    });

    /* =========================================
       ✨ LÓGICA DE INTERACTIVIDAD DE LA TABLA
       ========================================= */
    
    // Cerrar el modal de detalles
    document.getElementById("close-modal-detalle").addEventListener("click", () => {
        document.getElementById("modal-detalle").classList.add("hidden");
    });

    // Escuchador global de la tabla (Sirve para todo: Ordenar, Detalle, Editar, Borrar)
    document.querySelector(".tableros-container").addEventListener("click", (e) => {
        
        // ↕️ 1. HACER CLIC EN CABECERAS PARA ORDENAR
        if (e.target.parentElement && e.target.parentElement.classList.contains("tabla-header")) {
            const columnaTexto = e.target.innerText.replace(" ⬆️", "").replace(" ⬇️", "").trim();
            if (columnaTexto === "Acciones" || columnaTexto === "Operador" || columnaTexto === "Puerta/Vía") return; // No ordenamos por estas de momento

            if (columnaOrden === columnaTexto) {
                ordenAscendente = !ordenAscendente;
            } else {
                columnaOrden = columnaTexto;
                ordenAscendente = true;
            }

            // Actualizar las flechitas visualmente
            document.querySelectorAll(".tabla-header span").forEach(span => {
                span.innerText = span.innerText.replace(" ⬆️", "").replace(" ⬇️", "").trim();
            });
            e.target.innerText = columnaTexto + (ordenAscendente ? " ⬆️" : " ⬇️");
            aplicarFiltros();
            return; // Cortamos aquí para que no haga nada más
        }

        // 🗑️ 2. BORRAR
        if (e.target.classList.contains("btn-borrar")) {
            const idOperacion = e.target.getAttribute("data-id");
            if (confirm("⚠️ ¿Estás seguro de que quieres eliminar esta operación?")) {
                let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
                operacionesGuardadas = operacionesGuardadas.filter(op => op.operacionId !== idOperacion);
                localStorage.setItem("operaciones", JSON.stringify(operacionesGuardadas));
                aplicarFiltros();
            }
            return;
        }

        // ✏️ 3. EDITAR
        if (e.target.classList.contains("btn-editar")) {
            const idOperacion = e.target.getAttribute("data-id");
            let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
            const opToEdit = operacionesGuardadas.find(op => op.operacionId === idOperacion);

            if (opToEdit) {
                document.getElementById("op-id").value = opToEdit.operacionId;
                document.getElementById("op-estado").value = opToEdit.estado;

                const selectOperador = document.getElementById("op-operador");
                selectOperador.innerHTML = operadores.map(o => `<option value="${o.operadorId}" ${o.operadorId === opToEdit.operadorId ? 'selected' : ''}>${o.nombre}</option>`).join("");
                const selectPunto = document.getElementById("op-punto");
                selectPunto.innerHTML = puntos.map(p => `<option value="${p.puntoId}" ${p.puntoId === opToEdit.puntoId ? 'selected' : ''}>${p.codigo}</option>`).join("");

                document.getElementById("modal-operacion").classList.remove("hidden");
            }
            return;
        }

        // 🔍 4. ABRIR DETALLES (Hacer clic en cualquier parte de la fila)
        const fila = e.target.closest(".operacion-row");
        if (fila && !e.target.closest(".acciones-gestor")) { // Ignoramos si tocó los botones
            const idOperacion = fila.getAttribute("data-id");
            let opsGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
            const op = opsGuardadas.find(o => o.operacionId === idOperacion);
            
            if (op) {
                const operador = operadores.find(o => o.operadorId === op.operadorId);
                const punto = puntos.find(p => p.puntoId === op.puntoId);
                
                // Formateamos las fechas
                const horaProg = new Date(op.horaProgramada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                const horaEst = new Date(op.horaEstimada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

                // Inyectamos el HTML dentro del modal
                const contenido = `
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
                document.getElementById("detalle-contenido").innerHTML = contenido;
                document.getElementById("modal-detalle").classList.remove("hidden");
            }
        }
    });

    /* =========================================
       RESTO DE LÓGICA (CREAR, EDITAR, USUARIOS, AUTO-RELOAD)
       ========================================= */

    // Cerrar modal de edición
    document.getElementById("close-modal-op").addEventListener("click", () => document.getElementById("modal-operacion").classList.add("hidden"));

    // Guardar Edición
    document.getElementById("form-operacion").addEventListener("submit", (e) => {
        e.preventDefault();
        const idEditado = document.getElementById("op-id").value;
        let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
        const index = operacionesGuardadas.findIndex(op => op.operacionId === idEditado);

        if (index !== -1) {
            operacionesGuardadas[index].estado = document.getElementById("op-estado").value;
            operacionesGuardadas[index].operadorId = parseInt(document.getElementById("op-operador").value);
            operacionesGuardadas[index].puntoId = parseInt(document.getElementById("op-punto").value);
            localStorage.setItem("operaciones", JSON.stringify(operacionesGuardadas));
            document.getElementById("modal-operacion").classList.add("hidden");
            aplicarFiltros(); 
        }
    });

    // Modal Crear
    const modalCrear = document.getElementById("modal-crear");
    const formCrear = document.getElementById("form-crear");
    document.getElementById("close-modal-crear").addEventListener("click", () => modalCrear.classList.add("hidden"));
    
    document.getElementById("crear-sentido").addEventListener("change", (e) => {
        document.getElementById("label-ciudad").innerText = e.target.value === "salida" ? "Destino" : "Origen";
    });

    document.body.addEventListener("click", (e) => {
        if (e.target.id === "btn-nueva-operacion") {
            document.getElementById("crear-operador").innerHTML = operadores.map(o => `<option value="${o.operadorId}">${o.nombre}</option>`).join("");
            document.getElementById("crear-punto").innerHTML = puntos.map(p => `<option value="${p.puntoId}">${p.codigo}</option>`).join("");
            modalCrear.classList.remove("hidden");
        }
    });

    formCrear.addEventListener("submit", (e) => {
        e.preventDefault();
        const codigo = document.getElementById("crear-codigo").value;
        const sentido = document.getElementById("crear-sentido").value;
        const ciudad = document.getElementById("crear-ciudad").value;
        const hora = new Date(document.getElementById("crear-hora").value).getTime(); 

        if (isNaN(hora)) { alert("Por favor, selecciona una fecha válida."); return; }

        let opsGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
        if(opsGuardadas.some(op => op.codigo.toUpperCase() === codigo.toUpperCase())) { alert("⚠️ Ya existe ese código."); return; }

        opsGuardadas.push({
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

        localStorage.setItem("operaciones", JSON.stringify(opsGuardadas));
        formCrear.reset();
        modalCrear.classList.add("hidden");
        aplicarFiltros();
    });

    // Usuarios
    const modalUsuarios = document.getElementById("modal-usuarios");
    document.getElementById("close-modal-usuarios").addEventListener("click", () => modalUsuarios.classList.add("hidden"));

    function renderizarUsuarios() {
        let usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];
        document.getElementById("lista-usuarios").innerHTML = usuariosGuardados.map(u => {
            let btnHtml = u.rol === "GESTOR" 
                ? `<button class="btn-cambiar-rol" data-email="${u.email}" data-rol="PÚBLICO" style="background:#e74c3c;color:white;padding:6px;border:none;border-radius:4px;cursor:pointer;width:100%;">Degradar ⬇️</button>`
                : `<button class="btn-cambiar-rol" data-email="${u.email}" data-rol="GESTOR" style="background:#3498db;color:white;padding:6px;border:none;border-radius:4px;cursor:pointer;width:100%;">Ascender ⬆️</button>`;
            
            return `<div style="display:grid; grid-template-columns:2fr 1fr 1.5fr; padding:12px; border-bottom:1px solid var(--border-color); align-items:center;">
                <span style="font-weight:bold;">${u.email}</span>
                <span style="color:${u.rol==="GESTOR"?"#2ecc71":"#95a5a6"};font-weight:bold;font-size:0.8rem;">${u.rol}</span>
                <div>${btnHtml}</div></div>`;
        }).join("");
    }

    document.body.addEventListener("click", (e) => {
        if (e.target.id === "btn-gestionar-usuarios") {
            renderizarUsuarios();
            modalUsuarios.classList.remove("hidden");
        }
        if (e.target.classList.contains("btn-cambiar-rol")) {
            const email = e.target.getAttribute("data-email");
            const nuevoRol = e.target.getAttribute("data-rol");
            let usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];

            if (nuevoRol === "PÚBLICO" && usuariosGuardados.filter(u => u.rol === "GESTOR").length <= 1) {
                alert("⚠️ ALERTA: No puedes degradar al último Gestor."); return;
            }

            const index = usuariosGuardados.findIndex(u => u.email === email);
            if (index !== -1) {
                usuariosGuardados[index].rol = nuevoRol;
                localStorage.setItem("usuarios", JSON.stringify(usuariosGuardados));
                if (email === usuarioActivo.email && nuevoRol === "PÚBLICO") {
                    document.getElementById("btn-logout").click(); return;
                }
                renderizarUsuarios(); 
            }
        }
    });

    // Piloto automático
    setInterval(() => { console.log("⏱️ Refrescando..."); aplicarFiltros(); }, 60000); 
});