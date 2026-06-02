import { DbOp } from "../data/DbOp.js";

const ROL_GESTOR = "GESTOR";
const ROL_PUBLICO = "PUBLICO";

export class AdminController {
    constructor(onDataChangedCallback) {
        this.onDataChanged = onDataChangedCallback;
        this.initListeners();
    }

    initListeners() {
        ["close-modal-op", "close-modal-crear", "close-modal-usuarios", "close-modal-operadores", "close-modal-puntos"].forEach(id => {
            document.getElementById(id)?.addEventListener("click", (e) => e.target.closest('.modal-overlay').classList.add("hidden"));
        });

        ["modal-operacion", "modal-crear", "modal-usuarios", "modal-operadores", "modal-puntos"].forEach(id => {
            document.getElementById(id)?.addEventListener("click", (e) => {
                if (e.target.id === id) e.target.classList.add("hidden");
            });
        });

        document.getElementById("form-operacion")?.addEventListener("submit", (e) => this.handleEditarOperacion(e));
        document.getElementById("form-crear")?.addEventListener("submit", (e) => this.handleCrearOperacion(e));
        document.getElementById("form-add-operador")?.addEventListener("submit", (e) => this.handleCrearOperador(e));
        document.getElementById("form-add-punto")?.addEventListener("submit", (e) => this.handleCrearPunto(e));

        document.body.addEventListener("click", (e) => this.handleGlobalClicks(e));

        const selectTipoCrear = document.getElementById("crear-tipo");
        if (selectTipoCrear) selectTipoCrear.addEventListener("change", (e) => this.actualizarDesplegablePuntos(e.target.value));

        const selectSentidoCrear = document.getElementById("crear-sentido");
        if (selectSentidoCrear) {
            selectSentidoCrear.addEventListener("change", (e) => {
                const inputCiudad = document.getElementById("crear-ciudad");
                const labelCiudad = document.querySelector('label[for="crear-ciudad"]') || (inputCiudad ? inputCiudad.previousElementSibling : null);
                if (labelCiudad) labelCiudad.innerText = e.target.value === "llegada" ? "Origen" : "Destino";
            });
        }
    }

    async actualizarDesplegablePuntos(tipoSeleccionado) {
        const todosLosPuntos = await DbOp.getPuntos();
        const esVuelo = tipoSeleccionado.toLowerCase().includes("vuelo");
        
        const puntosFiltrados = todosLosPuntos.filter(p => p.tipo.toLowerCase() === (esVuelo ? "puerta" : "via"));
        const selectPunto = document.getElementById("crear-punto");
        
        if (selectPunto) {
            selectPunto.innerHTML = puntosFiltrados.map(p => `<option value="${p.id}">${p.codigo}</option>`).join("");
            const labelPunto = document.querySelector('label[for="crear-punto"]') || selectPunto.previousElementSibling;
            if (labelPunto) labelPunto.innerText = esVuelo ? "Puerta" : "Vía";
        }
    }

    handleGlobalClicks(e) {
        if (e.target.closest(".btn-editar") || e.target.closest(".btn-borrar")) this.handleAccionesOperacionDOM(e);
        else if (e.target.closest("#btn-nueva-operacion") || e.target.closest("#btn-gestionar-usuarios") || e.target.closest("#btn-gestionar-operadores") || e.target.closest("#btn-gestionar-puntos")) this.handleAperturaModales(e);
        else if (e.target.closest(".btn-cambiar-rol")) this.handleCambiarRol(e);
        else if (e.target.closest(".btn-borrar-operador") || e.target.closest(".btn-borrar-punto")) this.handleBorrarCatalogos(e);
    }

    // --- Sub-métodos aislados ---
    async handleAccionesOperacionDOM(e) {
        const btnEditar = e.target.closest(".btn-editar");
        if (btnEditar) {
            document.getElementById("modal-operacion")?.classList.remove("hidden");
            
            document.getElementById("op-operador").innerHTML = '<option>⏳ Cargando...</option>';
            document.getElementById("op-punto").innerHTML = '<option>⏳ Cargando...</option>';

            try {
                const [operaciones, operadores, puntos] = await Promise.all([
                    DbOp.getOperaciones(),
                    DbOp.getOperadores(),
                    DbOp.getPuntos()
                ]);
                
                const op = operaciones.find(o => String(o.id) === btnEditar.getAttribute("data-id"));
                
                if (op) {
                    document.getElementById("op-id").value = op.id;
                    document.getElementById("op-estado").value = op.estado;
                    
                    document.getElementById("op-operador").innerHTML = operadores.map(o => 
                        `<option value="${o.id}" ${String(o.id) === String(op.operadorId) ? 'selected' : ''}>${o.nombre}</option>`
                    ).join("");
                    
                    document.getElementById("op-punto").innerHTML = puntos.map(p => 
                        `<option value="${p.id}" ${String(p.id) === String(op.puntoId) ? 'selected' : ''}>${p.codigo}</option>`
                    ).join("");
                }
            } catch(error) {
                console.error("Error al cargar datos para edición:", error);
            }
            return;
        }

        const btnBorrar = e.target.closest(".btn-borrar");
        if (btnBorrar && confirm("⚠️ ¿Deseas borrar definitivamente esta operación?")) {
            const row = e.target.closest(".operacion-row");
            if(row) row.style.opacity = "0.4"; // Feedback visual instantáneo
            await DbOp.deleteOperacion(btnBorrar.getAttribute("data-id"));
            this.onDataChanged();
        }
    }

    async handleAperturaModales(e) {
        if (e.target.closest("#btn-nueva-operacion")) {
            document.getElementById("modal-crear")?.classList.remove("hidden");
            
            const selectOp = document.getElementById("crear-operador");
            if(selectOp) selectOp.innerHTML = '<option>⏳ Cargando...</option>';

            try {
                const [operadores, puntos] = await Promise.all([
                    DbOp.getOperadores(),
                    DbOp.getPuntos()
                ]);
                
                if(selectOp) selectOp.innerHTML = operadores.map(o => `<option value="${o.id}">${o.nombre}</option>`).join("");
                
                const tipoSeleccionado = document.getElementById("crear-tipo")?.value || "";
                const esVuelo = tipoSeleccionado.toLowerCase().includes("vuelo");
                const puntosFiltrados = puntos.filter(p => p.tipo.toLowerCase() === (esVuelo ? "puerta" : "via"));
                
                const selectPunto = document.getElementById("crear-punto");
                if (selectPunto) {
                    selectPunto.innerHTML = puntosFiltrados.map(p => `<option value="${p.id}">${p.codigo}</option>`).join("");
                    const labelPunto = document.querySelector('label[for="crear-punto"]') || selectPunto.previousElementSibling;
                    if (labelPunto) labelPunto.innerText = esVuelo ? "Puerta" : "Vía";
                }
                
                const selectSentido = document.getElementById("crear-sentido");
                const labelCiudad = document.querySelector('label[for="crear-ciudad"]') || document.getElementById("crear-ciudad")?.previousElementSibling;
                if (selectSentido && labelCiudad) labelCiudad.innerText = selectSentido.value === "llegada" ? "Origen" : "Destino";
            } catch(error) {
                console.error("Error al cargar modal de nueva operación:", error);
            }
        }
        else if (e.target.closest("#btn-gestionar-usuarios")) { 
            document.getElementById("modal-usuarios")?.classList.remove("hidden"); 
            document.getElementById("lista-usuarios").innerHTML = "<p style='text-align:center; padding:15px;'>⏳ Descargando base de datos...</p>";
            await this.renderizarUsuarios(); 
        }
        else if (e.target.closest("#btn-gestionar-operadores")) { 
            document.getElementById("modal-operadores")?.classList.remove("hidden"); 
            document.getElementById("lista-operadores").innerHTML = "<p style='text-align:center; padding:15px;'>⏳ Descargando base de datos...</p>";
            await this.renderizarOperadores(); 
        }
        else if (e.target.closest("#btn-gestionar-puntos")) { 
            document.getElementById("modal-puntos")?.classList.remove("hidden"); 
            document.getElementById("lista-puntos").innerHTML = "<p style='text-align:center; padding:15px;'>⏳ Descargando base de datos...</p>";
            await this.renderizarPuntos(); 
        }
    }

    async handleCambiarRol(e) {
        const btnRol = e.target.closest(".btn-cambiar-rol");
        const id = btnRol.getAttribute("data-id");
        const nuevoRol = btnRol.getAttribute("data-rol");
        
        // 👁️ FEEDBACK VISUAL
        const textoOriginal = btnRol.innerText;
        btnRol.innerText = "⏳...";
        btnRol.disabled = true;
        
        try {
            const usuarios = await DbOp.getUsers();
            if (nuevoRol === ROL_PUBLICO && usuarios.filter(u => u.rol === ROL_GESTOR).length <= 1) {
                btnRol.innerText = textoOriginal;
                btnRol.disabled = false;
                return alert("⚠️ ALERTA DE SISTEMA: No puedes degradar al último Gestor disponible.");
            }
            
            await DbOp.updateRolUser(id, [nuevoRol]);
            
            const userActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
            if (userActivo && String(userActivo.id) === String(id)) {
                location.reload(); // Si se quita el rol a sí mismo, lo echamos al login
            } else { 
                await this.renderizarUsuarios(); 
                this.onDataChanged(); 
            }
        } catch (error) {
            alert("❌ Error al cambiar el rol: " + error.message);
            // 🧹 Si algo explota, restauramos el botón
            btnRol.innerText = textoOriginal;
            btnRol.disabled = false;
        }
    }

    async handleBorrarCatalogos(e) {
        if (e.target.closest(".btn-borrar-operador")) {
            const id = e.target.closest(".btn-borrar-operador").getAttribute("data-id");
            document.getElementById("lista-operadores").innerHTML = "<p style='text-align:center;'>⏳ Borrando en servidor...</p>";
            
            await DbOp.deleteOperador(id);
            await this.renderizarOperadores(); 
            this.onDataChanged();
        } else if (e.target.closest(".btn-borrar-punto")) {
            const id = e.target.closest(".btn-borrar-punto").getAttribute("data-id");
            document.getElementById("lista-puntos").innerHTML = "<p style='text-align:center;'>⏳ Borrando en servidor...</p>";
            
            await DbOp.deletePunto(id);
            await this.renderizarPuntos(); 
            this.onDataChanged();
        }
    }
    // --- Fin Sub-métodos ---

    async handleCrearOperacion(e) { 
        e.preventDefault();
        
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const textOriginal = btnSubmit.innerText;
        btnSubmit.innerText = "⏳ Creando...";
        btnSubmit.disabled = true;

        const horaStr = document.getElementById("crear-hora").value;
        if (!horaStr) {
            btnSubmit.innerText = textOriginal;
            btnSubmit.disabled = false;
            return;
        }

        const sentido = document.getElementById("crear-sentido").value;
        const ciudad = document.getElementById("crear-ciudad").value;
        
        // 💡 CONSTRUCCIÓN DEL PAQUETE: Ajustado según el estándar de tu API
        const datosNuevos = {
            tipo: document.getElementById("crear-tipo").value, 
            codigo: document.getElementById("crear-codigo").value,
            sentido: sentido,
            origen: sentido === "llegada" ? ciudad : "Madrid",
            destino: sentido === "salida" ? ciudad : "Madrid",
            horaProgramada: new Date(horaStr).toISOString(),
            horaEstimada: new Date(horaStr).toISOString(),
            estado: "PROGRAMADO", 
            // Enviamos los IDs como enteros simples, que suele ser lo que espera Slim
            operadorId: parseInt(document.getElementById("crear-operador").value),
            puntoId: parseInt(document.getElementById("crear-punto").value)
        };

        try {
            await DbOp.createOperacion(datosNuevos);
            e.target.reset(); 
            document.getElementById("modal-crear").classList.add("hidden");
            this.onDataChanged();
        } catch(err) {
            console.error("Fallo al crear operación:", err);
            alert("Error: Revisa que todos los campos sean correctos.");
        } finally {
            btnSubmit.innerText = textOriginal;
            btnSubmit.disabled = false;
        }
    }

    async handleEditarOperacion(e) { 
        e.preventDefault();
        
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const textOriginal = btnSubmit.innerText;
        btnSubmit.innerText = "⏳ Guardando...";
        btnSubmit.disabled = true;

        const id = document.getElementById("op-id").value;
        const datosActualizados = {
            estado: document.getElementById("op-estado").value,
            operadorId: parseInt(document.getElementById("op-operador").value),
            puntoId: parseInt(document.getElementById("op-punto").value)
        };

        try {
            await DbOp.updateOperacion(id, datosActualizados);
            document.getElementById("modal-operacion").classList.add("hidden");
            this.onDataChanged(); 
        } catch(err) {
            console.error("Fallo al editar operación:", err);
            alert("Error al comunicarse con el servidor Docker.");
        } finally {
            btnSubmit.innerText = textOriginal;
            btnSubmit.disabled = false;
        }
    }

    async handleCrearOperador(e) { 
        e.preventDefault();
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const textOriginal = btnSubmit.innerText;
        btnSubmit.innerText = "⏳...";
        btnSubmit.disabled = true;

        const datos = {
            nombre: document.getElementById("nuevo-op-nombre").value,
            siglas: document.getElementById("nuevo-op-siglas").value.toUpperCase()
        };
        e.target.reset(); 

        try {
            await DbOp.createOperador(datos);
            await this.renderizarOperadores(); 
            this.onDataChanged();
        } catch(err) {
            console.error(err);
        } finally {
            btnSubmit.innerText = textOriginal;
            btnSubmit.disabled = false;
        }
    }

    async handleCrearPunto(e) { 
        e.preventDefault();
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const textOriginal = btnSubmit.innerText;
        btnSubmit.innerText = "⏳...";
        btnSubmit.disabled = true;

        const datos = {
            tipo: document.getElementById("nuevo-pto-tipo").value,
            codigo: document.getElementById("nuevo-pto-codigo").value.toUpperCase()
        };
        e.target.reset(); 

        try {
            await DbOp.createPunto(datos);
            await this.renderizarPuntos(); 
            this.onDataChanged();
        } catch(err) {
            console.error(err);
        } finally {
            btnSubmit.innerText = textOriginal;
            btnSubmit.disabled = false;
        }
    }

    async renderizarUsuarios() { 
        try {
            const usu = await DbOp.getUsers();
            document.getElementById("lista-usuarios").innerHTML = usu.map(u => `
                <article class="modal-list-row" style="grid-template-columns: 2fr 1fr 1.5fr;">
                    <span style="font-weight:bold;">${u.email}</span>
                    <span style="color:${u.rol === ROL_GESTOR ? '#2ecc71' : '#95a5a6'}; font-size:0.8rem; font-weight:bold;">${u.rol}</span>
                    <button class="btn-cambiar-rol" data-id="${u.id}" data-rol="${u.rol === ROL_GESTOR ? ROL_PUBLICO : ROL_GESTOR}" style="background:#3498db; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Cambiar Rol</button>
                </article>`).join("");
        } catch(err) {
            document.getElementById("lista-usuarios").innerHTML = "<p>Error de conexión.</p>";
        }
    }

    async renderizarOperadores() { 
        try {
            const op = await DbOp.getOperadores();
            document.getElementById("lista-operadores").innerHTML = op.map(o => `
                <article class="modal-list-row" style="grid-template-columns: 2fr 1fr 1fr;">
                    <span style="font-weight:bold;">${o.nombre}</span><span>${o.siglas}</span>
                    <button class="btn-borrar-operador" data-id="${o.id}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar 🗑️</button>
                </article>`).join("");
        } catch(err) {
            document.getElementById("lista-operadores").innerHTML = "<p>Error de conexión.</p>";
        }
    }

    async renderizarPuntos() { 
        try {
            const pt = await DbOp.getPuntos();
            document.getElementById("lista-puntos").innerHTML = pt.map(p => `
                <article class="modal-list-row" style="grid-template-columns: 1fr 2fr 1fr;">
                    <span style="font-weight:bold;">${p.tipo}</span><span>${p.codigo}</span>
                    <button class="btn-borrar-punto" data-id="${p.id}" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding: 6px; cursor:pointer;">Borrar 🗑️</button>
                </article>`).join("");
        } catch(err) {
            document.getElementById("lista-puntos").innerHTML = "<p>Error de conexión.</p>";
        }
    }
}