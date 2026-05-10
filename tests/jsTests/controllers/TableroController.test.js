import { jest } from '@jest/globals';
import { TableroController } from '../../../js/controllers/TableroController.js';

describe('📊 Controlador del Tablero (TableroController)', () => {
    let mockTableroView;
    let tableroController;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();

        const operacionesSimuladas = [
            { operacionId: "1", codigo: "RYN123", tipo: "VUELO", origen: "Madrid", destino: "Londres", sentido: "salida", estado: "PROGRAMADO", horaProgramada: 1000, horaEstimada: 1000, operadorId: 1, puntoId: 1 },
            { operacionId: "2", codigo: "VLG456", tipo: "VUELO", origen: "Paris", destino: "Madrid", sentido: "llegada", estado: "EN VUELO", horaProgramada: 3000, horaEstimada: 3000, operadorId: 2, puntoId: 2 }
        ];
        localStorage.setItem("operaciones", JSON.stringify(operacionesSimuladas));

        // Añadida la opción PROGRAMADO en el select para que JSDOM la reconozca
        document.body.innerHTML = /*HTML*/`
            <div class="filtros">
                <input id="busqueda-codigo" value="">
                <select id="filtro-estado">
                    <option value="TODOS">TODOS</option>
                    <option value="PROGRAMADO">PROGRAMADO</option>
                </select>
            </div>
            <div class="auth-buttons"></div>
            
            <div class="tableros-container">
                <div class="panel">
                    <button class="btn-expandir-tabla" title="Ver más detalles"></button>
                    <div class="tabla-header">
                        <span id="cabecera-codigo">CODIGO</span>
                        <span id="cabecera-fecha">FECHA-HORA</span>
                    </div>
                </div>
            </div>
            
            <div id="modal-detalle" class="hidden"><div id="detalle-contenido"></div><h2 id="titulo-detalle"></h2></div>
        `;

        mockTableroView = { render: jest.fn() };
    });

    describe('Inicialización y Memoria de Filtros 💾', () => {
        it('debería restaurar la búsqueda y el filtro desde sessionStorage al iniciar', () => {
            // Simulamos que el usuario hizo una búsqueda antes de recargar la página
            sessionStorage.setItem("memoriaBusqueda", "RYN");
            sessionStorage.setItem("memoriaEstado", "PROGRAMADO");

            // Instanciamos el controlador para que lea el sessionStorage
            tableroController = new TableroController(mockTableroView);

            expect(tableroController.inputBusqueda.value).toBe("RYN");
            expect(tableroController.selectEstado.value).toBe("PROGRAMADO");
        });
    });

    describe('Responsive y Expansión Móvil 📱', () => {
        it('debería togglear la expansión de la tabla y cambiar el título del botón al hacer clic', () => {
            tableroController = new TableroController(mockTableroView);
            
            const btnExpandir = document.querySelector(".btn-expandir-tabla");
            const panel = document.querySelector(".panel");

            // Clic 1: Expande
            btnExpandir.dispatchEvent(new MouseEvent("click"));
            expect(panel.classList.contains("tabla-expandida")).toBe(true);
            expect(btnExpandir.title).toBe("Contraer tabla");

            // Clic 2: Contrae
            btnExpandir.dispatchEvent(new MouseEvent("click"));
            expect(panel.classList.contains("tabla-expandida")).toBe(false);
            expect(btnExpandir.title).toBe("Ver más detalles");
        });
    });

    describe('Sistema de Ordenación e Interacción', () => {
        beforeEach(() => {
            tableroController = new TableroController(mockTableroView);
        });

        it('debería filtrar por buscador de código en tiempo real', () => {
            tableroController.inputBusqueda.value = "vlg";
            tableroController.aplicarFiltros();
            const llegadas = mockTableroView.render.mock.calls[0][1]; // Argumento 2 es llegadas
            expect(llegadas[0].codigo).toBe("VLG456");
        });

        it('debería invertir el orden si se clica la columna activa', () => {
            tableroController.columnaActivaID = "FECHA-HORA";
            tableroController.ordenAscendente = true;

            const span = document.getElementById("cabecera-fecha");
            span.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            expect(tableroController.ordenAscendente).toBe(false);
        });

        it('debería cambiar de columna y resetear a ascendente', () => {
            const span = document.getElementById("cabecera-codigo");
            span.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            expect(tableroController.columnaActivaID).toBe("CODIGO");
            expect(tableroController.ordenAscendente).toBe(true);
        });

        it('debería mostrar el modal de detalles', () => {
            tableroController.mostrarDetalleOperacion("1");
            expect(document.getElementById("modal-detalle").classList.contains("hidden")).toBe(false);
            expect(document.getElementById("detalle-contenido").innerHTML).toContain("RYN123");
        });

        it('debería cerrar el modal de detalle al hacer clic en el overlay', () => {
            const modalDetalle = document.getElementById("modal-detalle");
            modalDetalle.classList.remove('hidden');

            const eventoClick = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(eventoClick, 'target', { value: modalDetalle, enumerable: true });
            modalDetalle.dispatchEvent(eventoClick);

            expect(modalDetalle.classList.contains("hidden")).toBe(true);
        });
    });
});