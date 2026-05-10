import { jest } from '@jest/globals';
import { TableroView } from '../../../js/views/TableroView.js';

describe('📊 Tests de Vista: TableroView', () => {
    let view;

    beforeEach(() => {
        document.body.innerHTML = /* html */`
            <div class="tableros-container">
                <article id="panel-salidas" class="panel">
                    <section id="lista-salidas"></section>
                </article>
                <article id="panel-llegadas" class="panel">
                    <section id="lista-llegadas"></section>
                </article>
            </div>
        `;
        
        // Limpiamos localStorage simulado por si acaso
        localStorage.clear();
        view = new TableroView();
    });

    describe('Formateo Relativo de Fechas ⏱️', () => {
        it('las fechas de ayer usan "A-" y las de mañana "M-"', () => {
            const ahora = Date.now();
            const unDia = 24 * 60 * 60 * 1000;
            
            const opAyer = { operacionId: "1", horaProgramada: ahora - unDia, estado: "LLEGADO", tipo: "vuelo" };
            const opHoy = { operacionId: "2", horaProgramada: ahora, estado: "PROGRAMADO", tipo: "vuelo" };
            const opManana = { operacionId: "3", horaProgramada: ahora + unDia, estado: "PROGRAMADO", tipo: "vuelo" };

            // Usamos generarFilaHTML que por debajo llama a nuestro método privado #formatearFechaRelativa
            const htmlAyer = view.generarFilaHTML(opAyer, null, null, false);
            const htmlHoy = view.generarFilaHTML(opHoy, null, null, false);
            const htmlManana = view.generarFilaHTML(opManana, null, null, false);

            expect(htmlAyer).toMatch(/>A-\d{2}:\d{2}</);
            expect(htmlHoy).toMatch(/>\d{2}:\d{2}</);
            expect(htmlHoy).not.toMatch(/>[AM]-\d{2}:\d{2}</);
            expect(htmlManana).toMatch(/>M-\d{2}:\d{2}</);
        });
    });

    describe('Filtro de 24 Horas 🗂️', () => {
        it('separa correctamente el historial de lo reciente', () => {
            const ahora = Date.now();
            const limite24h = ahora - (24 * 60 * 60 * 1000);
            
            const salidasMocks = [
                { operacionId: "old1", horaProgramada: limite24h - 10000, estado: "LLEGADO", tipo: "vuelo" },
                { operacionId: "old2", horaProgramada: limite24h - 50000, estado: "LLEGADO", tipo: "vuelo" },
                { operacionId: "new1", horaProgramada: ahora, estado: "PROGRAMADO", tipo: "vuelo" }
            ];

            // Renderizamos pasándole las operaciones
            view.render(salidasMocks, [], [], [], null);

            const contenedorHistorico = document.querySelector("#hist-salidas .cuerpo-historico");
            const contenedorReciente = document.querySelector("#lista-salidas .cuerpo-reciente");

            // Validamos contando cuántas clases 'operacion-row' se han inyectado en cada caja
            expect(contenedorHistorico.innerHTML.match(/operacion-row/g).length).toBe(2);
            expect(contenedorReciente.innerHTML.match(/operacion-row/g).length).toBe(1);
        });
    });

    describe('Renderizado de Interfaz y Permisos 🖼️', () => {
        it('debería mostrar iconos de edición y borrado SOLO si es Gestor', () => {
            const opMock = { operacionId: "1", horaProgramada: Date.now(), estado: "PROGRAMADO", tipo: "vuelo" };

            const htmlPublico = view.generarFilaHTML(opMock, null, null, false); // false = no es gestor
            const htmlGestor = view.generarFilaHTML(opMock, null, null, true);  // true = es gestor

            expect(htmlPublico).not.toContain('acciones-gestor');
            expect(htmlGestor).toContain('acciones-gestor');
            expect(htmlGestor).toContain('btn-editar');
            expect(htmlGestor).toContain('btn-borrar');
        });

        it('debería renderizar un emoji si no hay URL de imagen, y un <img> si la hay', () => {
            const opMock = { operacionId: "1", horaProgramada: Date.now(), estado: "PROGRAMADO", tipo: "vuelo" };
            const operadorEmoji = { urlIcono: "🚄" };
            const operadorImg = { urlIcono: "https://ejemplo.com/logo.png" };

            const htmlEmoji = view.generarFilaHTML(opMock, operadorEmoji, null, false);
            const htmlImg = view.generarFilaHTML(opMock, operadorImg, null, false);

            expect(htmlEmoji).toContain('>🚄</span>');
            expect(htmlImg).toContain('<img src="https://ejemplo.com/logo.png"');
        });
    });
});