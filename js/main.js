// js/main.js

import { inicializarDatos } from "./data/seed.js";
import { TableroView } from "./views/TableroView.js";
import { AuthView } from "./views/AuthView.js";
import { Usuario, ROLES_USUARIO } from "./models/Usuario.js";

// Función para generar un pseudo-ULID de 26 caracteres alfanuméricos
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

    // 1. Extraemos los datos base (los originales) que no cambian
    const operadores = JSON.parse(localStorage.getItem("operadores")) || [];
    const puntos = JSON.parse(localStorage.getItem("puntos")) || [];

    const tablero = new TableroView();
    const authView = new AuthView();

    // Capturamos los elementos del HTML
    const inputBusqueda = document.getElementById("busqueda-codigo");
    const selectEstado = document.getElementById("filtro-estado");

    // Comprobar si ya había alguien logueado al cargar la página
    let usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
    authView.renderAuthButtons(usuarioActivo);

    // 2. Función maestra de filtrado
    const aplicarFiltros = () => {
        let operacionesActuales = JSON.parse(localStorage.getItem("operaciones")) || [];
        
        const textoCriterio = inputBusqueda.value.toLowerCase();
        const estadoCriterio = selectEstado.value;

        // Filtramos el array
        const operacionesFiltradas = operacionesActuales.filter(op => {
            const coincideCodigo = op.codigo.toLowerCase().includes(textoCriterio);
            const coincideEstado = estadoCriterio === "TODOS" || op.estado === estadoCriterio;
            return coincideCodigo && coincideEstado;
        });

        // Volvemos a pintar
        tablero.render(operacionesFiltradas, operadores, puntos, usuarioActivo);

        // 🆕 Inyectar botones de Gestión si es GESTOR
        const contenedorFiltros = document.querySelector(".filtros");
        let btnNuevo = document.getElementById("btn-nueva-operacion");
        let btnUsuarios = document.getElementById("btn-gestionar-usuarios");
        
        if (usuarioActivo && usuarioActivo.rol === "GESTOR") {
            if (!btnNuevo) {
                btnNuevo = document.createElement("button");
                btnNuevo.id = "btn-nueva-operacion";
                btnNuevo.className = "btn-primary";
                btnNuevo.style.marginLeft = "15px";
                btnNuevo.style.backgroundColor = "#2ecc71"; // Verde destacado
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
    };

    // 3. Conectamos los eventos
    inputBusqueda.addEventListener("input", aplicarFiltros);
    selectEstado.addEventListener("change", aplicarFiltros);
    aplicarFiltros(); // Pintado inicial


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
                aplicarFiltros(); // Refrescamos para inyectar los botones de admin
            } else {
                alert("Credenciales incorrectas ❌");
            }
        } else {
            // Lógica de Registro (Sign Up)
            if (usuariosCargados.some(u => u.email === email)) {
                alert("Ese email ya existe 📧");
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
       🛠️ LÓGICA DE GESTIÓN (EDITAR Y BORRAR)
       ========================================= */
    
    const modalOp = document.getElementById("modal-operacion");
    const formOp = document.getElementById("form-operacion");

    document.getElementById("close-modal-op").addEventListener("click", () => {
        modalOp.classList.add("hidden");
    });

    document.querySelector(".tableros-container").addEventListener("click", (e) => {
        
        // 👉 BORRAR
        if (e.target.classList.contains("btn-borrar")) {
            const idOperacion = e.target.getAttribute("data-id");
            if (confirm("⚠️ ¿Estás seguro de que quieres eliminar esta operación?")) {
                let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
                operacionesGuardadas = operacionesGuardadas.filter(op => op.operacionId !== idOperacion);
                localStorage.setItem("operaciones", JSON.stringify(operacionesGuardadas));
                aplicarFiltros();
            }
        }

        // 👉 EDITAR
        if (e.target.classList.contains("btn-editar")) {
            const idOperacion = e.target.getAttribute("data-id");
            let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
            const opToEdit = operacionesGuardadas.find(op => op.operacionId === idOperacion);

            if (opToEdit) {
                document.getElementById("op-id").value = opToEdit.operacionId;
                document.getElementById("op-estado").value = opToEdit.estado;

                const selectOperador = document.getElementById("op-operador");
                selectOperador.innerHTML = operadores.map(o => 
                    `<option value="${o.operadorId}" ${o.operadorId === opToEdit.operadorId ? 'selected' : ''}>${o.nombre}</option>`
                ).join("");

                const selectPunto = document.getElementById("op-punto");
                selectPunto.innerHTML = puntos.map(p => 
                    `<option value="${p.puntoId}" ${p.puntoId === opToEdit.puntoId ? 'selected' : ''}>${p.codigo}</option>`
                ).join("");

                modalOp.classList.remove("hidden");
            }
        }
    });

    formOp.addEventListener("submit", (e) => {
        e.preventDefault();
        const idEditado = document.getElementById("op-id").value;
        const nuevoEstado = document.getElementById("op-estado").value;
        const nuevoOperadorId = parseInt(document.getElementById("op-operador").value);
        const nuevoPuntoId = parseInt(document.getElementById("op-punto").value);

        let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
        const index = operacionesGuardadas.findIndex(op => op.operacionId === idEditado);

        if (index !== -1) {
            operacionesGuardadas[index].estado = nuevoEstado;
            operacionesGuardadas[index].operadorId = nuevoOperadorId;
            operacionesGuardadas[index].puntoId = nuevoPuntoId;
            localStorage.setItem("operaciones", JSON.stringify(operacionesGuardadas));
            
            modalOp.classList.add("hidden");
            aplicarFiltros(); 
            console.log("✅ Operación actualizada");
        }
    });


    /* =========================================
       ➕ LÓGICA DE GESTIÓN (CREAR OPERACIÓN)
       ========================================= */

    const modalCrear = document.getElementById("modal-crear");
    const formCrear = document.getElementById("form-crear");

    document.getElementById("close-modal-crear").addEventListener("click", () => {
        modalCrear.classList.add("hidden");
    });

    document.getElementById("crear-sentido").addEventListener("change", (e) => {
        const label = document.getElementById("label-ciudad");
        label.innerText = e.target.value === "salida" ? "Destino" : "Origen";
    });

    // Delegamos los clics de la cabecera al document.body
    document.body.addEventListener("click", (e) => {
        
        // ABRIR MODAL CREAR
        if (e.target.id === "btn-nueva-operacion") {
            const selectOp = document.getElementById("crear-operador");
            selectOp.innerHTML = operadores.map(o => `<option value="${o.operadorId}">${o.nombre}</option>`).join("");
            
            const selectPto = document.getElementById("crear-punto");
            selectPto.innerHTML = puntos.map(p => `<option value="${p.puntoId}">${p.codigo}</option>`).join("");

            modalCrear.classList.remove("hidden");
        }
    });

    formCrear.addEventListener("submit", (e) => {
        e.preventDefault();
        const tipo = document.getElementById("crear-tipo").value;
        const codigo = document.getElementById("crear-codigo").value;
        const sentido = document.getElementById("crear-sentido").value;
        const ciudad = document.getElementById("crear-ciudad").value;
        const hora = new Date(document.getElementById("crear-hora").value).getTime(); 
        const operadorId = parseInt(document.getElementById("crear-operador").value);
        const puntoId = parseInt(document.getElementById("crear-punto").value);

        if (isNaN(hora)) {
            alert("Por favor, selecciona una fecha y hora válidas.");
            return;
        }

        const nuevaOperacion = {
            operacionId: generarULID(), 
            tipo: tipo,
            codigo: codigo,
            sentido: sentido,
            origen: sentido === "llegada" ? ciudad : "Madrid", 
            destino: sentido === "salida" ? ciudad : "Madrid",
            horaProgramada: hora,
            horaEstimada: hora,
            estado: "PROGRAMADO", 
            operadorId: operadorId,
            puntoId: puntoId
        };

        let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
        
        if(operacionesGuardadas.some(op => op.codigo.toUpperCase() === codigo.toUpperCase())){
            alert("⚠️ Ya existe una operación con ese código.");
            return;
        }

        operacionesGuardadas.push(nuevaOperacion);
        localStorage.setItem("operaciones", JSON.stringify(operacionesGuardadas));

        formCrear.reset();
        modalCrear.classList.add("hidden");
        aplicarFiltros();
        console.log("✅ Nueva operación creada");
    });


    /* =========================================
       👥 LÓGICA DE GESTIÓN DE USUARIOS
       ========================================= */

    const modalUsuarios = document.getElementById("modal-usuarios");
    const listaUsuariosHTML = document.getElementById("lista-usuarios");

    document.getElementById("close-modal-usuarios").addEventListener("click", () => {
        modalUsuarios.classList.add("hidden");
    });

    function renderizarUsuarios() {
        let usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];
        
        listaUsuariosHTML.innerHTML = usuariosGuardados.map(u => {
            let btnHtml = "";
            let colorRol = u.rol === "GESTOR" ? "#2ecc71" : "#95a5a6"; 

            if (u.rol === "GESTOR") {
                btnHtml = `<button class="btn-cambiar-rol" data-email="${u.email}" data-rol="PÚBLICO" style="background: #e74c3c; color: white; padding: 6px 12px; border:none; border-radius:4px; cursor:pointer; width: 100%;">Degradar ⬇️</button>`;
            } else {
                btnHtml = `<button class="btn-cambiar-rol" data-email="${u.email}" data-rol="GESTOR" style="background: #3498db; color: white; padding: 6px 12px; border:none; border-radius:4px; cursor:pointer; width: 100%;">Ascender ⬆️</button>`;
            }

            return `
                <div style="display: grid; grid-template-columns: 2fr 1fr 1.5fr; padding: 12px; border-bottom: 1px solid var(--border-color); align-items: center;">
                    <span style="font-weight: bold;">${u.email}</span>
                    <span style="color: ${colorRol}; font-weight: bold; font-size: 0.8rem;">${u.rol}</span>
                    <div>${btnHtml}</div>
                </div>
            `;
        }).join("");
    }

    // Delegamos los clics de gestión de usuarios al body
    document.body.addEventListener("click", (e) => {
        
        // ABRIR MODAL USUARIOS
        if (e.target.id === "btn-gestionar-usuarios") {
            renderizarUsuarios();
            modalUsuarios.classList.remove("hidden");
        }

        // BOTONES ASCENDER/DEGRADAR
        if (e.target.classList.contains("btn-cambiar-rol")) {
            const emailToChange = e.target.getAttribute("data-email");
            const nuevoRol = e.target.getAttribute("data-rol");
            
            let usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];

            // Regla para evitar borrar al último Gestor
            if (nuevoRol === "PÚBLICO") {
                const gestoresTotales = usuariosGuardados.filter(u => u.rol === "GESTOR").length;
                if (gestoresTotales <= 1) {
                    alert("⚠️ ALERTA: No puedes degradar al último Gestor. El sistema se quedaría sin administradores.");
                    return;
                }
            }

            const index = usuariosGuardados.findIndex(u => u.email === emailToChange);
            if (index !== -1) {
                usuariosGuardados[index].rol = nuevoRol;
                localStorage.setItem("usuarios", JSON.stringify(usuariosGuardados));

                // Suicidio admin
                if (emailToChange === usuarioActivo.email && nuevoRol === "PÚBLICO") {
                    alert("Te has revocado los permisos de Gestor a ti mismo. Se cerrará la sesión.");
                    document.getElementById("btn-logout").click();
                    return;
                }

                renderizarUsuarios(); 
            }
        }
    });
});