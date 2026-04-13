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

    // 2. Función maestra de filtrado (Actualizada para recibir usuarioActivo)
    const aplicarFiltros = () => {
        // Extraemos las operaciones cada vez que filtramos por si se ha borrado alguna
        let operacionesActuales = JSON.parse(localStorage.getItem("operaciones")) || [];
        
        const textoCriterio = inputBusqueda.value.toLowerCase();
        const estadoCriterio = selectEstado.value;

        // Filtramos el array
        const operacionesFiltradas = operacionesActuales.filter(op => {
            // Regla 1: ¿Coincide el código?
            const coincideCodigo = op.codigo.toLowerCase().includes(textoCriterio);
            
            // Regla 2: ¿Coincide el estado? (Si es "TODOS", pasa siempre)
            const coincideEstado = estadoCriterio === "TODOS" || op.estado === estadoCriterio;

            return coincideCodigo && coincideEstado;
        });

        // Volvemos a pintar con los resultados del filtro Y le pasamos el usuario activo
        tablero.render(operacionesFiltradas, operadores, puntos, usuarioActivo);

        // 🆕 Inyectar botón de "Nueva Operación" si es Gestor
        const contenedorFiltros = document.querySelector(".filtros");
        let btnNuevo = document.getElementById("btn-nueva-operacion");
        
        if (usuarioActivo && usuarioActivo.rol === "GESTOR") {
            if (!btnNuevo) { // Si no existe, lo creamos
                btnNuevo = document.createElement("button");
                btnNuevo.id = "btn-nueva-operacion";
                btnNuevo.className = "btn-primary";
                btnNuevo.style.marginLeft = "15px";
                btnNuevo.style.backgroundColor = "#2ecc71"; // Verde destacado
                btnNuevo.innerText = "➕ Nueva Operación";
                contenedorFiltros.appendChild(btnNuevo);
            }
        } else {
            if (btnNuevo) btnNuevo.remove(); // Si no es gestor y existe, lo borramos
        }
    };

    // 3. Conectamos los eventos de los filtros
    inputBusqueda.addEventListener("input", aplicarFiltros);
    selectEstado.addEventListener("change", aplicarFiltros);

    // Pintado inicial
    aplicarFiltros();


    /* =========================================
        🔐 LÓGICA DE LOGIN Y REGISTRO
       ========================================= */

    // Eventos para abrir el modal
    document.getElementById("btn-login").addEventListener("click", () => authView.show(false));
    document.getElementById("btn-signup").addEventListener("click", () => authView.show(true));
    document.getElementById("close-modal").addEventListener("click", () => authView.hide());

    // Manejar el envío del formulario
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
                
                // 🆕 Recargamos el tablero para que aparezcan los botones de Gestor si lo es
                aplicarFiltros();
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
            authView.show(false); // Pasamos a modo login
        }
    });

    // Lógica de Logout
    document.getElementById("btn-logout").addEventListener("click", () => {
        sessionStorage.removeItem("usuarioActivo");
        usuarioActivo = null;
        authView.renderAuthButtons(null);
        alert("Sesión cerrada 👋");
        location.reload(); // Recargamos para limpiar la vista y quitar los botones de Gestor
    });


    /* =========================================
        🛠️ LÓGICA DE GESTIÓN (EDITAR Y BORRAR)
       ========================================= */
    
    const modalOp = document.getElementById("modal-operacion");
    const formOp = document.getElementById("form-operacion");

    // Cerrar el modal de edición
    document.getElementById("close-modal-op").addEventListener("click", () => {
        modalOp.classList.add("hidden");
    });

    // 1. Escuchamos los clics en los botones de las tablas
    document.querySelector(".tableros-container").addEventListener("click", (e) => {
        
        // 👉 SI HACEN CLIC EN BORRAR 🗑️
        if (e.target.classList.contains("btn-borrar")) {
            const idOperacion = e.target.getAttribute("data-id");
            if (confirm("⚠️ ¿Estás seguro de que quieres eliminar esta operación?")) {
                let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
                operacionesGuardadas = operacionesGuardadas.filter(op => op.operacionId !== idOperacion);
                localStorage.setItem("operaciones", JSON.stringify(operacionesGuardadas));
                aplicarFiltros();
            }
        }

        // 👉 SI HACEN CLIC EN EDITAR ✏️
        if (e.target.classList.contains("btn-editar")) {
            const idOperacion = e.target.getAttribute("data-id");
            let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
            
            // Buscamos los datos actuales de ese vuelo/tren
            const opToEdit = operacionesGuardadas.find(op => op.operacionId === idOperacion);

            if (opToEdit) {
                // Rellenamos el ID oculto y el estado
                document.getElementById("op-id").value = opToEdit.operacionId;
                document.getElementById("op-estado").value = opToEdit.estado;

                // Generamos dinámicamente las opciones de Operadores
                const selectOperador = document.getElementById("op-operador");
                selectOperador.innerHTML = operadores.map(o => 
                    `<option value="${o.operadorId}" ${o.operadorId === opToEdit.operadorId ? 'selected' : ''}>
                        ${o.nombre}
                    </option>`
                ).join("");

                // Generamos dinámicamente las opciones de Puntos (Puertas/Vías)
                const selectPunto = document.getElementById("op-punto");
                selectPunto.innerHTML = puntos.map(p => 
                    `<option value="${p.puntoId}" ${p.puntoId === opToEdit.puntoId ? 'selected' : ''}>
                        ${p.codigo}
                    </option>`
                ).join("");

                // ¡Abrimos el modal!
                modalOp.classList.remove("hidden");
            }
        }
    });

    // 2. Guardar los cambios del formulario de Edición
    formOp.addEventListener("submit", (e) => {
        e.preventDefault(); // Evitamos que la página se recargue

        // Capturamos los nuevos valores del formulario
        const idEditado = document.getElementById("op-id").value;
        const nuevoEstado = document.getElementById("op-estado").value;
        const nuevoOperadorId = parseInt(document.getElementById("op-operador").value);
        const nuevoPuntoId = parseInt(document.getElementById("op-punto").value);

        // Traemos el array, lo modificamos y lo volvemos a guardar
        let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
        const index = operacionesGuardadas.findIndex(op => op.operacionId === idEditado);

        if (index !== -1) {
            operacionesGuardadas[index].estado = nuevoEstado;
            operacionesGuardadas[index].operadorId = nuevoOperadorId;
            operacionesGuardadas[index].puntoId = nuevoPuntoId;

            localStorage.setItem("operaciones", JSON.stringify(operacionesGuardadas));
            
            // Cerramos modal y repintamos
            modalOp.classList.add("hidden");
            aplicarFiltros(); 
            console.log("✅ Operación actualizada con éxito");
        }
    });

    /* =========================================
        ➕ LÓGICA DE GESTIÓN (CREAR OPERACIÓN)
       ========================================= */

    const modalCrear = document.getElementById("modal-crear");
    const formCrear = document.getElementById("form-crear");

    // Cerrar el modal de creación
    document.getElementById("close-modal-crear").addEventListener("click", () => {
        modalCrear.classList.add("hidden");
    });

    // Cambiar la etiqueta "Destino" u "Origen" según lo que elijamos en "Sentido"
    document.getElementById("crear-sentido").addEventListener("change", (e) => {
        const label = document.getElementById("label-ciudad");
        label.innerText = e.target.value === "salida" ? "Destino" : "Origen";
    });

    // Escuchamos el botón (que añadiremos por JS para que solo lo vea el gestor)
    document.body.addEventListener("click", (e) => {
        if (e.target.id === "btn-nueva-operacion") {
            // Rellenar dinámicamente los selectores de Operador y Punto
            const selectOp = document.getElementById("crear-operador");
            selectOp.innerHTML = operadores.map(o => `<option value="${o.operadorId}">${o.nombre}</option>`).join("");
            
            const selectPto = document.getElementById("crear-punto");
            selectPto.innerHTML = puntos.map(p => `<option value="${p.puntoId}">${p.codigo}</option>`).join("");

            modalCrear.classList.remove("hidden");
        }
    });

    // Guardar la NUEVA Operación
    formCrear.addEventListener("submit", (e) => {
        e.preventDefault();

        // 1. Recogemos todos los valores
        const tipo = document.getElementById("crear-tipo").value;
        const codigo = document.getElementById("crear-codigo").value;
        const sentido = document.getElementById("crear-sentido").value;
        const ciudad = document.getElementById("crear-ciudad").value;
        const hora = new Date(document.getElementById("crear-hora").value).getTime(); // Convertimos a milisegundos
        const operadorId = parseInt(document.getElementById("crear-operador").value);
        const puntoId = parseInt(document.getElementById("crear-punto").value);

        // Validaciones extra:
        if (isNaN(hora)) {
            alert("Por favor, selecciona una fecha y hora válidas.");
            return;
        }

        // 2. Creamos la estructura simulando la clase Operacion (ya que estamos en main)
        const nuevaOperacion = {
            operacionId: generarULID(), // ¡Usamos nuestra función!
            tipo: tipo,
            codigo: codigo,
            sentido: sentido,
            // Asignamos a origen o destino dependiendo del sentido
            origen: sentido === "llegada" ? ciudad : "Madrid", // Suponemos que Madrid es la base
            destino: sentido === "salida" ? ciudad : "Madrid",
            horaProgramada: hora,
            horaEstimada: hora,
            estado: "PROGRAMADO", // Por defecto
            operadorId: operadorId,
            puntoId: puntoId
        };

        // 3. Guardamos en LocalStorage
        let operacionesGuardadas = JSON.parse(localStorage.getItem("operaciones")) || [];
        
        // Verificamos que el código no exista ya
        if(operacionesGuardadas.some(op => op.codigo.toUpperCase() === codigo.toUpperCase())){
            alert("⚠️ Ya existe una operación con ese código.");
            return;
        }

        operacionesGuardadas.push(nuevaOperacion);
        localStorage.setItem("operaciones", JSON.stringify(operacionesGuardadas));

        // 4. Cerramos modal, limpiamos y repintamos
        formCrear.reset();
        modalCrear.classList.add("hidden");
        aplicarFiltros();
        console.log("✅ Nueva operación creada con éxito:", nuevaOperacion.codigo);
    });
});