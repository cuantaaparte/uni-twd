import { jest } from '@jest/globals';
import { AdminController } from '../../../js/controllers/AdminController.js';

// ⏱️ TRUCO MÁGICO: Pausa para esperar a las promesas
const esperarAsincronia = () => new Promise(resolve => setTimeout(resolve, 0));

describe('⚙️ Controlador de Administración (AdminController)', () => {
    let mockOnDataChanged;
    let adminController;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.alert = jest.fn(); 
        window.confirm = jest.fn(); 

        document.body.innerHTML = /*HTML*/`
            <div id="modal-crear" class="hidden"></div>
            <form id="form-crear">
                <input id="crear-hora" value="2026-05-20T10:30" />
                
                <select id="crear-sentido"><option value="salida">Salida</option><option value="llegada">Llegada</option></select>
                <label for="crear-ciudad">Destino</label>
                <input id="crear-ciudad" value="Londres" />
                
                <select id="crear-tipo"><option value="Vuelo">Vuelo</option><option value="Tren">Tren</option></select>
                <input id="crear-codigo" value="RYN123" />
                <select id="crear-operador"><option value="1">Ryanair</option></select>
                
                <label for="crear-punto">Puerta</label>
                <select id="crear-punto"></select>
            </form>

            <form id="form-add-operador">
                <input id="nuevo-op-nombre" value="Vueling" />
                <input id="nuevo-op-siglas" value="VY" />
            </form>
            <form id="form-add-punto">
                <input id="nuevo-pto-tipo" value="PUERTA" />
                <input id="nuevo-pto-codigo" value="T1-A5" />
            </form>

            <div id="lista-usuarios"></div>
            <div id="lista-operadores"></div>
            <div id="lista-puntos"></div>
        `;

        localStorage.setItem("puntos", JSON.stringify([
            { puntoId: 1, tipo: "PUERTA", codigo: "T1-A1" },
            { puntoId: 2, tipo: "VIA", codigo: "VIA 4" }
        ]));

        mockOnDataChanged = jest.fn();
        adminController = new AdminController(mockOnDataChanged);
    });

    describe('Interacción Dinámica de Formularios (Selects Dependientes) 🔄', () => {
        it('debería mostrar "Vía" y filtrar puntos al seleccionar "Tren"', async () => {
            const selectTipo = document.getElementById("crear-tipo");
            selectTipo.value = "Tren";
            selectTipo.dispatchEvent(new Event("change"));

            await esperarAsincronia(); // ⏳

            const labelPunto = document.querySelector('label[for="crear-punto"]');
            const opcionesPunto = document.getElementById("crear-punto").innerHTML;

            expect(labelPunto.innerText).toBe("Vía");
            expect(opcionesPunto).toContain("VIA 4");
            expect(opcionesPunto).not.toContain("T1-A1");
        });

        it('debería cambiar la etiqueta de ciudad a "Origen" al seleccionar "Llegada"', () => {
            const selectSentido = document.getElementById("crear-sentido");
            selectSentido.value = "llegada";
            selectSentido.dispatchEvent(new Event("change"));

            const labelCiudad = document.querySelector('label[for="crear-ciudad"]');
            expect(labelCiudad.innerText).toBe("Origen");
        });
    });

    describe('Cierre de Modales 🖱️', () => {
        it('debería cerrar el modal al hacer clic en su fondo (overlay)', () => {
            const modalCrear = document.getElementById('modal-crear');
            modalCrear.classList.remove('hidden');

            const eventoClick = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(eventoClick, 'target', { value: modalCrear, enumerable: true });
            modalCrear.dispatchEvent(eventoClick);

            expect(modalCrear.classList.contains('hidden')).toBe(true);
        });
    });

    describe('Gestión de Usuarios y Roles', () => {
        it('debería impedir degradar al último GESTOR del sistema', async () => {
            const usuarios = [{ id: 1, email: 'admin@aeropuerto.com', rol: 'GESTOR' }];
            localStorage.setItem('usuarios', JSON.stringify(usuarios));

            const botonCambiar = document.createElement('button');
            botonCambiar.className = 'btn-cambiar-rol';
            botonCambiar.setAttribute('data-id', '1'); // 🔧 Actualizado a data-id
            botonCambiar.setAttribute('data-rol', 'PÚBLICO'); 
            document.body.appendChild(botonCambiar);

            botonCambiar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            
            await esperarAsincronia(); // ⏳

            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('ALERTA DE SISTEMA: No puedes degradar al último Gestor'));
        });

        it('debería permitir degradar a un GESTOR si hay más de uno', async () => {
            const usuarios = [
                { id: 1, email: 'admin1@aeropuerto.com', rol: 'GESTOR' },
                { id: 2, email: 'admin2@aeropuerto.com', rol: 'GESTOR' }
            ];
            localStorage.setItem('usuarios', JSON.stringify(usuarios));

            const botonCambiar = document.createElement('button');
            botonCambiar.className = 'btn-cambiar-rol';
            botonCambiar.setAttribute('data-id', '2'); // 🔧 Actualizado a data-id
            botonCambiar.setAttribute('data-rol', 'PÚBLICO');
            document.body.appendChild(botonCambiar); 

            botonCambiar.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            await esperarAsincronia(); // ⏳

            const bdActualizada = JSON.parse(localStorage.getItem('usuarios'));
            const usuarioModificado = bdActualizada.find(u => String(u.id) === '2');
            expect(usuarioModificado.rol).toBe('PÚBLICO');
        });
    });

    describe('Creación de Datos Básicos', () => {
        it('debería crear un nuevo Operador correctamente', async () => {
            document.getElementById('form-add-operador').dispatchEvent(new Event('submit'));
            
            await esperarAsincronia(); // ⏳
            
            const operadores = JSON.parse(localStorage.getItem('operadores'));
            expect(operadores).toHaveLength(1);
            expect(operadores[0].nombre).toBe('Vueling');
        });

        it('debería crear un nuevo Punto correctamente', async () => {
            document.getElementById('form-add-punto').dispatchEvent(new Event('submit'));
            
            await esperarAsincronia(); // ⏳
            
            const puntos = JSON.parse(localStorage.getItem('puntos'));
            expect(puntos).toHaveLength(3); 
            expect(puntos[2].codigo).toBe('T1-A5'); 
        });
    });

    describe('Edición y Borrado de Operaciones 🛠️', () => {
        it('debería borrar una Operación si el gestor confirma la acción', async () => {
            const opsIniciales = [{ operacionId: "123", codigo: "VLG1" }, { operacionId: "456", codigo: "RYN2" }];
            localStorage.setItem("operaciones", JSON.stringify(opsIniciales));

            window.confirm.mockReturnValue(true);

            const btnBorrar = document.createElement("button");
            btnBorrar.className = "btn-borrar";
            btnBorrar.setAttribute("data-id", "123");
            document.body.appendChild(btnBorrar);

            btnBorrar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            
            await esperarAsincronia(); // ⏳

            const opsActualizadas = JSON.parse(localStorage.getItem("operaciones"));
            expect(opsActualizadas).toHaveLength(1);
            // Validamos que se borró el 123 y quedó el 456
            expect(opsActualizadas[0].operacionId || opsActualizadas[0].id).toBe("456");
        });
    });
});