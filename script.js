let usuarioActual = null;
let tipoCambioUSD = 950.0;

const destinosDemo = [
    { id: 1, nombre: "Cajon del Maipo", zona: "Region Metropolitana", costo: 45000 },
    { id: 2, nombre: "Salar de Surire", zona: "Region de Arica y Parinacota", costo: 310000 },
    { id: 3, nombre: "Valle del Elqui", zona: "Region de Coquimbo", costo: 120000 },
    { id: 4, nombre: "Parque Conguillio", zona: "Region de La Araucania", costo: 185000 },
    { id: 5, nombre: "San Pedro de Atacama", zona: "Region de Antofagasta", costo: 400000 }
];

const paquetesIniciales = [
    { id: 1, nombre: "Escapada Centro-Norte", fechaSalida: "2026-10-24", precio: 426000, cupo: 10 },
    { id: 2, nombre: "Aventura Sur y Lagos", fechaSalida: "2026-11-05", precio: 580000, cupo: 8 },
    { id: 3, nombre: "Ruta del Elqui y Astronomia", fechaSalida: "2026-11-12", precio: 290000, cupo: 12 }
];

document.addEventListener("DOMContentLoaded", () => {
    inicializarPaquetes();
    obtenerTipoCambio();
    cargarCatalogoDestinos();
    cargarCatalogoPaquetes();
    poblarSelectPaquetes();
    cargarEstadoSesion();
});

function obtenerPaquetes() {
    const creados = localStorage.getItem("paquetes_aventura");
    if (!creados) {
        localStorage.setItem("paquetes_aventura", JSON.stringify(paquetesIniciales));
        return paquetesIniciales;
    }
    return JSON.parse(creados);
}

function inicializarPaquetes() {
    obtenerPaquetes();
}

async function obtenerTipoCambio() {
    const contenedor = document.getElementById("indicador-dolar");
    try {
        const respuesta = await fetch("https://mindicador.cl/api/dolar");
        if (respuesta.ok) {
            const datos = await respuesta.json();
            tipoCambioUSD = datos.serie.valor;
            contenedor.innerText = `Tipo de Cambio Hoy: 1 USD = $${tipoCambioUSD.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CLP`;
        } else {
            throw new Error("Respuesta no satisfactoria de la API");
        }
    } catch (error) {
        contenedor.innerText = `Tipo de Cambio Estimado: 1 USD = $${tipoCambioUSD.toLocaleString("es-CL")} CLP`;
    }
    cargarCatalogoDestinos();
    cargarCatalogoPaquetes();
}

function cargarCatalogoDestinos() {
    const grid = document.getElementById("grid-destinos");
    if (!grid) return;
    grid.innerHTML = "";

    destinosDemo.forEach(dest => {
        const precioUSD = (dest.costo / tipoCambioUSD).toFixed(2);
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <h3>${dest.nombre}</h3>
            <p><strong>Ubicacion:</strong> ${dest.zona}</p>
            <p>$${dest.costo.toLocaleString("es-CL")} CLP <small>(USD $${precioUSD})</small></p>
        `;
        grid.appendChild(card);
    });
}

function cargarCatalogoPaquetes() {
    const grid = document.getElementById("grid-paquetes");
    if (!grid) return;
    grid.innerHTML = "";

    const paquetes = obtenerPaquetes();

    paquetes.forEach(paq => {
        const precioUSD = (paq.precio / tipoCambioUSD).toFixed(2);
        const card = document.createElement("div");
        card.className = "card";

        let botonEliminar = "";
        if (usuarioActual && usuarioActual.rol === "admin") {
            botonEliminar = ``;
        }

        card.innerHTML = `
            <h3>${paq.nombre}</h3>
            <p><strong>Fecha Salida:</strong> ${paq.fechaSalida}</p>
            <p><strong>Cupo Disponible:</strong> ${paq.cupo} personas</p>
            <p>$${paq.precio.toLocaleString("es-CL")} CLP <small>(USD $${precioUSD})</small></p>
            ${botonEliminar}
        `;
        grid.appendChild(card);
    });
}

function poblarSelectPaquetes() {
    const select = document.getElementById("select-paquete");
    if (!select) return;
    select.innerHTML = '<option value="">-- Seleccione un Paquete --</option>';

    const paquetes = obtenerPaquetes();
    paquetes.forEach(paq => {
        const option = document.createElement("option");
        option.value = paq.id;
        option.textContent = `${paq.nombre} - $${paq.precio.toLocaleString("es-CL")} CLP`;
        select.appendChild(option);
    });

    select.addEventListener("change", calcularTotalReserva);
}

function calcularTotalReserva() {
    const select = document.getElementById("select-paquete");
    const cantInput = document.getElementById("cant-pasajeros");
    const spanPrecioUnitario = document.getElementById("resumen-precio-unitario");
    const spanTotal = document.getElementById("resumen-total");

    if (!select || !cantInput) return;

    const idSeleccionado = parseInt(select.value);
    const cantidad = parseInt(cantInput.value) || 1;

    const paquetes = obtenerPaquetes();
    const paquete = paquetes.find(p => p.id === idSeleccionado);

    if (paquete) {
        const total = paquete.precio * cantidad;
        if (spanPrecioUnitario) spanPrecioUnitario.textContent = `$${paquete.precio.toLocaleString("es-CL")} CLP`;
        if (spanTotal) spanTotal.textContent = `$${total.toLocaleString("es-CL")} CLP`;
    } else {
        if (spanPrecioUnitario) spanPrecioUnitario.textContent = "$0 CLP";
        if (spanTotal) spanTotal.textContent = "$0 CLP";
    }
}

function abrirModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) modal.classList.remove("hidden");
}

function cerrarModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) modal.classList.add("hidden");
}

// REGISTRO DE USUARIO
function registrarCliente(event) {
    event.preventDefault();
    const nombre = document.getElementById("reg-nombre").value.trim();
    const email = document.getElementById("reg-email").value.toLowerCase().trim();
    const rut = document.getElementById("reg-rut").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!password || password.length < 4) {
        alert("La contraseña debe tener al menos 4 caracteres.");
        return;
    }

    const esAdmin = email.includes("admin");
    const usuariosRegistrados = JSON.parse(localStorage.getItem("usuarios_aventura_db")) || [];

    const existe = usuariosRegistrados.find(u => u.email === email);
    if (existe) {
        alert("Este correo ya se encuentra registrado. Inicie sesión.");
        return;
    }

    const nuevoUsuario = {
        nombre: nombre,
        email: email,
        rut: rut,
        password: password,
        rol: esAdmin ? "admin" : "cliente"
    };

    usuariosRegistrados.push(nuevoUsuario);
    localStorage.setItem("usuarios_aventura_db", JSON.stringify(usuariosRegistrados));

    usuarioActual = {
        nombre: nombre,
        email: email,
        rut: rut,
        rol: nuevoUsuario.rol
    };

    localStorage.setItem("usuario_aventura", JSON.stringify(usuarioActual));
    cerrarModal("modal-registro");
    actualizarVistaSesion();
    alert(`Usuario ${nombre} (${usuarioActual.rol.toUpperCase()}) registrado e iniciado con éxito.`);
}

// INICIO DE SESIÓN
function iniciarSesion(event) {
    event.preventDefault();
    const email = document.getElementById("login-email").value.toLowerCase().trim();
    const password = document.getElementById("login-password").value;

    if (!password) {
        alert("Por favor ingrese su contraseña.");
        return;
    }

    const usuariosRegistrados = JSON.parse(localStorage.getItem("usuarios_aventura_db")) || [];
    const usuarioEncontrado = usuariosRegistrados.find(u => u.email === email);

    const esAdminAccesoDirecto = email.includes("admin");

    if (usuarioEncontrado) {
        if (usuarioEncontrado.password !== password) {
            alert("Contraseña incorrecta. Intente nuevamente.");
            return;
        }
        usuarioActual = {
            nombre: usuarioEncontrado.nombre,
            email: usuarioEncontrado.email,
            rut: usuarioEncontrado.rut,
            rol: usuarioEncontrado.rol
        };
    } else {
        const nombreLimpio = email.split("@")[0];
        usuarioActual = {
            nombre        : nombreLimpio,
        email: email,
        rut: "11.***.***-1",
        rol: esAdminAccesoDirecto ? "admin" : "cliente"
    };
    usuariosRegistrados.push({ ...usuarioActual, password: password });
    localStorage.setItem("usuarios_aventura_db", JSON.stringify(usuariosRegistrados));
}

localStorage.setItem("usuario_aventura", JSON.stringify(usuarioActual));
cerrarModal("modal-login");
actualizarVistaSesion();
alert(`Bienvenido de nuevo, ${usuarioActual.nombre} (${usuarioActual.rol.toUpperCase()}).`);
}

function cargarEstadoSesion() {
    const sesionGuardada = localStorage.getItem("usuario_aventura");
    if (sesionGuardada) {
        usuarioActual = JSON.parse(sesionGuardada);
        actualizarVistaSesion();
    }
}

function actualizarVistaSesion() {
    const btnLogin = document.getElementById("btn-login");
    const btnRegistro = document.getElementById("btn-registro");
    const btnLogout = document.getElementById("btn-logout");
    const adminPanel = document.getElementById("admin-panel");
    const thAcciones = document.getElementById("th-acciones");

    if (usuarioActual) {
        if (btnLogin) btnLogin.classList.add("hidden");
        if (btnRegistro) btnRegistro.classList.add("hidden");
        if (btnLogout) {
            btnLogout.classList.remove("hidden");
            btnLogout.textContent = `Cerrar Sesion (${usuarioActual.nombre} - ${usuarioActual.rol.toUpperCase()})`;
        }

        if (adminPanel) {
            if (usuarioActual.rol === "admin") {
                adminPanel.classList.remove("hidden");
            } else {
                adminPanel.classList.add("hidden");
            }
        }
        if (thAcciones) {
            if (usuarioActual.rol === "admin") {
                thAcciones.classList.remove("hidden");
            } else {
                thAcciones.classList.add("hidden");
            }
        }
    } else {
        if (btnLogin) btnLogin.classList.remove("hidden");
        if (btnRegistro) btnRegistro.classList.remove("hidden");
        if (btnLogout) btnLogout.classList.add("hidden");
        if (adminPanel) adminPanel.classList.add("hidden");
        if (thAcciones) thAcciones.classList.add("hidden");
    }

    cargarCatalogoPaquetes();
    actualizarTablaReservas();
}

function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem("usuario_aventura");
    actualizarVistaSesion();
    alert("Sesion cerrada correctamente.");
}
