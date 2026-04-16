import { jest } from '@jest/globals';
import { TableroView } from "../../../js/views/TableroView.js";
import { TableroController } from "../../../js/controllers/TableroController.js";

describe("🧪 Tests de Lógica de Negocio: Tablero", () => {
    let view;
    let controller;

    beforeEach(() => {
        // 🏗️ Preparamos el DOM falso para Jest
        document.body.innerHTML = `
            <div class="auth-buttons"></div>
            <div class="tableros-container">
                <article id="panel-salidas">
                    <section id="lista-salidas"></section>
                </article>
                <article id="panel-llegadas">
                    <section id="lista-llegadas"></section>
                </article>
            </div>
        `;
        
        // 🧹 Limpiamos mocks
        jest.clearAllMocks();
        Storage.prototype.setItem = jest.fn();
        Storage.prototype.getItem = jest.fn(() => null);

        view = new TableroView();
    });

    test("⏱️ MÁQUINA DEL TIEMPO: Las fechas de ayer usan 'A-' y las de mañana 'M-'", () => {
        const ahora = Date.now();
        const unDia = 24 * 60 * 60 * 1000;
        
        const opAyer = { operacionId: "1", horaProgramada: ahora - unDia, estado: "LLEGADO", tipo: "vuelo" };
        const opHoy = { operacionId: "2", horaProgramada: ahora, estado: "PROGRAMADO", tipo: "vuelo" };
        const opManana = { operacionId: "3", horaProgramada: ahora + unDia, estado: "PROGRAMADO", tipo: "vuelo" };

        const htmlAyer = view.generarFilaHTML(opAyer, null, null, false);
        const htmlHoy = view.generarFilaHTML(opHoy, null, null, false);
        const htmlManana = view.generarFilaHTML(opManana, null, null, false);

        // Verificamos que contengan los prefijos correctos
        expect(htmlAyer).toMatch(/>A-\d{2}:\d{2}</);
        expect(htmlHoy).toMatch(/>\d{2}:\d{2}</);
        expect(htmlHoy).not.toMatch(/>[AM]-\d{2}:\d{2}</);
        expect(htmlManana).toMatch(/>M-\d{2}:\d{2}</);
    });

    test("🗂️ FILTRO 24H: Separa correctamente el historial de lo reciente", () => {
        const ahora = Date.now();
        const limite24h = ahora - (24 * 60 * 60 * 1000);
        
        // 2 antiguas, 1 reciente
        const salidasMocks = [
            { operacionId: "old1", horaProgramada: limite24h - 10000, estado: "LLEGADO" },
            { operacionId: "old2", horaProgramada: limite24h - 50000, estado: "LLEGADO" },
            { operacionId: "new1", horaProgramada: ahora, estado: "PROGRAMADO" }
        ];

        view.render(salidasMocks, [], [], [], null);

        const contenedorHistorico = document.querySelector("#hist-salidas .cuerpo-historico");
        const contenedorReciente = document.querySelector("#lista-salidas .cuerpo-reciente");

        // Verificamos que se inyectaron en sus cajas correspondientes contando las filas
        expect(contenedorHistorico.innerHTML.match(/operacion-row/g).length).toBe(2);
        expect(contenedorReciente.innerHTML.match(/operacion-row/g).length).toBe(1);
    });

    test("🧠 ACORDEÓN LOCALSTORAGE: Guarda el estado al hacer clic en el historial", () => {
        controller = new TableroController(view, document.createElement("input"), document.createElement("select"));
        
        // Renderizamos algo para que exista el botón
        view.render([], [], [], [], null);
        
        const btnToggle = document.querySelector(".toggle-historico");
        const contenedorTarget = document.getElementById("hist-salidas");
        
        // Simulamos el clic
        const eventoClic = { target: btnToggle };
        
        // El contenedor por defecto tiene la clase 'hidden'. Al hacer clic, se la quita (está abierto)
        controller.handleTableClicks(eventoClic);
        
        // Esperamos que haya guardado en localStorage que está abierto (true)
        expect(Storage.prototype.setItem).toHaveBeenCalledWith("estado-hist-salidas", true);
        expect(contenedorTarget.classList.contains("hidden")).toBe(false);
    });
});