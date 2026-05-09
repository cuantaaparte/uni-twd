export class LayoutView {
    constructor() {
        this.appContainer = document.getElementById("app");
        this.renderBaseLayout();
    }

    renderBaseLayout() {
        /* html */
        const html = `
            <header>
                <h1>Panel Informativo</h1>
                <label class="theme-switch" for="checkbox-theme" title="Alternar Modo Oscuro">
                    <input type="checkbox" id="checkbox-theme" />
                    <div class="slider round">
                        <span class="icon moon">🌙</span>
                        <span class="icon sun">☀️</span>
                    </div>
                </label>
                <nav class="auth-buttons">
                    <button id="btn-login" class="btn-primary">Entrar</button>
                    <button id="btn-signup" class="btn-secondary">Registrarse</button>
                    <button id="btn-logout" class="btn-danger hidden">Cerrar Sesión</button>
                </nav>
            </header>

            <main>
                <section class="filtros" id="contenedor-filtros">
                    <input type="text" id="busqueda-codigo" placeholder="Buscar por código (ej: IB123)...">
                    <select id="filtro-estado" aria-label="Filtrar por estado">
                        <option value="TODOS">Todos los estados</option>
                        <option value="PROGRAMADO">Programado</option>
                        <option value="RETRASADO">Retrasado</option>
                        <option value="CANCELADO">Cancelado</option>
                        <option value="EMBARCANDO">Embarcando</option>
                        <option value="EN_RUTA">En ruta</option>
                        <option value="LLEGADO">Llegado</option>
                    </select>

                    <button id="btn-nueva-operacion" class="btn-primary hidden">➕ Nueva Operación</button>
                    <button id="btn-gestionar-usuarios" class="btn-secondary hidden">👥 Usuarios</button>
                    <button id="btn-gestionar-operadores" class="btn-secondary hidden">🏢 Operadores</button>
                    <button id="btn-gestionar-puntos" class="btn-secondary hidden">🚪 Puntos</button>
                </section>

                <section class="tableros-container">
                    <article class="panel" id="panel-salidas">
                        <div style="display: flex; justify-content: space-between; align-items: center; background-color: var(--accent-blue);">
                            <h2>🛫 Salidas</h2>
                            <button class="btn-expandir-tabla" title="Ver más detalles">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icono-flecha">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="tabla-scroll-wrapper">
                            <header class="tabla-header" id="header-salidas">
                                <span>Fecha-Hora</span>
                                <span>Código</span>
                                <span>Destino</span>
                                <span>Operador</span>
                                <span>Puerta/Vía</span>
                                <span>Estado</span>
                            </header>
                            <section id="lista-salidas"></section>
                        </div>
                    </article>

                    <article class="panel" id="panel-llegadas">
                        <div style="display: flex; justify-content: space-between; align-items: center; background-color: var(--accent-blue);">
                            <h2>🛬 Llegadas</h2>
                            <button class="btn-expandir-tabla" title="Ver más detalles">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icono-flecha">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>

                        <div class="tabla-scroll-wrapper">
                            <header class="tabla-header" id="header-llegadas">
                                <span>Fecha-Hora</span>
                                <span>Código</span>
                                <span>Origen</span>
                                <span>Operador</span>
                                <span>Puerta/Vía</span>
                                <span>Estado</span>
                            </header>
                            <section id="lista-llegadas"></section>
                        </div>
                    </article>
                </section>
            </main>
        `;
        // Inyectamos el HTML al principio del body
        this.appContainer.insertAdjacentHTML('afterbegin', html);
    }
}