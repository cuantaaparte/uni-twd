export class ThemeController {
    static init() {
        const botonTema = document.getElementById("checkbox-theme");
        const temaGuardado = localStorage.getItem("tema") || "dark";

        if (temaGuardado === "dark") {
            document.body.classList.add("dark-mode");
            if (botonTema) botonTema.checked = false;
        } else {
            document.body.classList.remove("dark-mode");
            if (botonTema) botonTema.checked = true;
        }

        if (botonTema) {
            botonTema.addEventListener("change", (evento) => {
                if (!evento.target.checked) {
                    document.body.classList.add("dark-mode");
                    localStorage.setItem("tema", "dark");
                } else {
                    document.body.classList.remove("dark-mode");
                    localStorage.setItem("tema", "light");
                }
            });
        }
    }
}