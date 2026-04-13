// js/main.js

import { inicializarDatos } from "./data/seed.js";
import { TableroView } from "./views/TableroView.js";
import { AuthView } from "./views/AuthView.js";
import { Usuario, ROLES_USUARIO } from "./models/Usuario.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("Sistema iniciado...");

    inicializarDatos();

    // 1. Extraemos los datos base (los originales)
    const operacionesOriginales = JSON.parse(localStorage.getItem("operaciones")) || [];
    const operadores = JSON.parse(localStorage.getItem("operadores")) || [];
    const puntos = JSON.parse(localStorage.getItem("puntos")) || [];

    const tablero = new TableroView();
    
    // Capturamos los elementos del HTML
    const inputBusqueda = document.getElementById("busqueda-codigo");
    const selectEstado = document.getElementById("filtro-estado");

    // 2. Función maestra de filtrado
    const aplicarFiltros = () => {
        const textoCriterio = inputBusqueda.value.toLowerCase();
        const estadoCriterio = selectEstado.value;

        // Filtramos el array
        const operacionesFiltradas = operacionesOriginales.filter(op => {
            // Regla 1: ¿Coincide el código?
            const coincideCodigo = op.codigo.toLowerCase().includes(textoCriterio);
            
            // Regla 2: ¿Coincide el estado? (Si es "TODOS", pasa siempre)
            const coincideEstado = estadoCriterio === "TODOS" || op.estado === estadoCriterio;

            return coincideCodigo && coincideEstado;
        });

        // 3. Volvemos a pintar con los resultados del filtro
        tablero.render(operacionesFiltradas, operadores, puntos);
    };

    // 4. Conectamos los eventos
    // 'input' se dispara cada vez que el usuario teclea
    inputBusqueda.addEventListener("input", aplicarFiltros);
    
    // 'change' se dispara cuando cambia el select
    selectEstado.addEventListener("change", aplicarFiltros);

    // Pintado inicial (con todo)
    tablero.render(operacionesOriginales, operadores, puntos);


    /*
    LOGIN
    */

    const authView = new AuthView();

    // 1. Comprobar si ya había alguien logueado al cargar la página
    let usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
    authView.renderAuthButtons(usuarioActivo);

    // 2. Eventos para abrir el modal
    document.getElementById("btn-login").addEventListener("click", () => authView.show(false));
    document.getElementById("btn-signup").addEventListener("click", () => authView.show(true));
    document.getElementById("close-modal").addEventListener("click", () => authView.hide());

    // 3. Manejar el envío del formulario
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

    // 4. Lógica de Logout
    document.getElementById("btn-logout").addEventListener("click", () => {
        sessionStorage.removeItem("usuarioActivo");
        usuarioActivo = null;
        authView.renderAuthButtons(null);
        alert("Sesión cerrada 👋");
        location.reload(); // Recargamos para limpiar la vista
    });
});