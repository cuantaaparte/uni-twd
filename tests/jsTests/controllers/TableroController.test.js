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

        document.body.innerHTML = `
            <div class="filtros"><input id="busqueda-codigo" value=""><select id="filtro-estado"><option value="TODOS">TODOS</option></select></div>
            <div class="auth-buttons"></div>
            <div class="tableros-container">
                <div class="tabla-header">
                    <span id="cabecera-codigo">CODIGO</span>
                    <span id="cabecera-fecha">FECHA-HORA</span>
                </div>
            </div>
            <div id="modal-detalle" class="hidden"><div id="detalle-contenido"></div><h2 id="titulo-detalle"></h2></div>
        `;

        mockTableroView = { render: jest.fn() };
        tableroController = new TableroController(mockTableroView);
    });

    it('debería filtrar por buscador de código', () => {
        tableroController.inputBusqueda.value = "vlg";
        tableroController.aplicarFiltros();
        const llegadas = mockTableroView.render.mock.calls[0][1];
        expect(llegadas[0].codigo).toBe("VLG456");
    });

    describe('Sistema de Ordenación', () => {
        it('debería invertir el orden si se clica la columna activa', () => {
            // Seteamos la columna actual
            tableroController.columnaActivaID = "FECHA-HORA";
            tableroController.ordenAscendente = true;

            const span = document.getElementById("cabecera-fecha");
            // Disparamos un clic real con burbujeo para que llegue al contenedor global
            span.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            expect(tableroController.ordenAscendente).toBe(false);
        });

        it('debería cambiar de columna y resetear a ascendente', () => {
            const span = document.getElementById("cabecera-codigo");
            span.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            expect(tableroController.columnaActivaID).toBe("CODIGO");
            expect(tableroController.ordenAscendente).toBe(true);
        });
    });

    it('debería mostrar el modal de detalles', () => {
        tableroController.mostrarDetalleOperacion("1");
        expect(document.getElementById("modal-detalle").classList.contains("hidden")).toBe(false);
        expect(document.getElementById("detalle-contenido").innerHTML).toContain("RYN123");
    });
});