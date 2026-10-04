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

// --- Inicialización ---
document.addEventListener("DOMContentLoaded", () => {
  inicializarPaquetes();
  obtenerTipoCambio();
  cargarCatalogoDestinos();
  cargarCatalogoPaquetes();
  poblarSelectPaquetes();
  cargarEstadoSesion();
});

// --- Paquetes en LocalStorage ---
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

// --- Tipo de Cambio ---
async function obtenerTipoCambio() {
  const contenedor = document.getElementById("indicador-dolar");
  try {
    const respuesta = await fetch("https://mindicador.cl/api/dolar");
    if (respuesta.ok) {
      const datos = await respuesta.json();
      tipoCambioUSD = datos.serie[0].valor;
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

// --- Catálogo de Destinos ---
function cargarCatalogoDestinos() {
  const grid = document.getElementById("grid-destinos");
  grid.innerHTML = "";
  destinosDemo.forEach(dest => {
    const precioUSD = (dest.costo / tipoCambioUSD).toFixed(2);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${dest.nombre}</h3>
      <p><strong>Ubicación:</strong> ${dest.zona}</p>
      <p>$${dest.costo.toLocaleString("es-CL")} CLP <small>(USD $${precioUSD})</small></p>
    `;
    grid.appendChild(card);
  });
}

// --- Catálogo de Paquetes ---
function cargarCatalogoPaquetes() {
  const grid = document.getElementById("grid-paquetes");
  grid.innerHTML = "";
  const paquetes = obtenerPaquetes();

  paquetes.forEach(paq => {
    const precioUSD = (paq.precio / tipoCambioUSD).toFixed(2);
    const card = document.createElement("div");
    card.className = "card";

    let botonEliminar = "";
    if (usuarioActual && usuarioActual.rol === "admin") {
      botonEliminar = `<button class="btn-danger" onclick="eliminarPaquete(${paq.id})">Eliminar</button>`;
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

// --- Selector de Paquetes ---
function poblarSelectPaquetes() {
  const select = document.getElementById("select-paquete");
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

// --- Cálculo de Reserva ---
function calcularTotalReserva() {
  const select = document.getElementById("select-paquete");
  const cantInput = document.getElementById("cant-pasajeros");
  const spanPrecioUnitario = document.getElementById("resumen-precio-unitario");
  const spanTotal = document.getElementById("resumen-total");

  const idSeleccionado = parseInt(select.value);
  const cantidad = parseInt(cantInput.value) || 1;
  const paquetes = obtenerPaquetes();
  const paquete = paquetes.find(p => p.id === idSeleccionado);

  if (paquete) {
    const total = paquete.precio * cantidad;
    spanPrecioUnitario.textContent = `$${paquete.precio.toLocaleString("es-CL")} CLP`;
    spanTotal.textContent = `$${total.toLocaleString("es-CL")} CLP`;
  } else {
    spanPrecioUnitario.textContent = "$0 CLP";
    spanTotal.textContent = "$0 CLP";
  }
}

}

// --- Modales ---
function abrirModal(idModal) {
  document.getElementById(idModal).classList.remove("hidden");
}

function cerrarModal(idModal) {
  document.getElementById(idModal).classList.add("hidden");
}

// --- Registro de Cliente ---
function registrarCliente(event) {
  event.preventDefault();
  const nombre = document.getElementById("reg-nombre").value.trim();
  const email = document.getElementById("reg-email").value.toLowerCase().trim();
  const rut = document.getElementById("reg-rut").value.trim();
  const esAdmin = email.includes("admin");

  usuarioActual = { nombre, email, rut, rol: esAdmin ? "admin" : "cliente" };
  localStorage.setItem("usuario_aventura", JSON.stringify(usuarioActual));

  cerrarModal("modal-registro");
  actualizarVistaSesion();
  alert(`Usuario ${nombre} (${usuarioActual.rol.toUpperCase()}) registrado e iniciado exitosamente.`);
}

// --- Inicio de Sesión ---
function iniciarSesion(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.toLowerCase().trim();
  const nombreLimpio = email.split("@")[0];
  const esAdmin = email.includes("admin");

  usuarioActual = { nombre: nombreLimpio, email, rut: "11.***.***-1", rol: esAdmin ? "admin" : "cliente" };
  localStorage.setItem("usuario_aventura", JSON.stringify(usuarioActual));

  cerrarModal("modal-login");
  actualizarVistaSesion();
  alert(`Bienvenido de nuevo, ${usuarioActual.nombre} (${usuarioActual.rol.toUpperCase()}).`);
}

// --- Estado de Sesión ---
function cargarEstadoSesion() {
  const sesionGuardada = localStorage.getItem("usuario_aventura");
  if (sesionGuardada) {
    usuarioActual = JSON.parse(sesionGuardada);
    actualizarVistaSesion();
  }
}

// --- Vista de Sesión ---
function actualizarVistaSesion() {
  const btnLogin = document.getElementById("btn-login");
  const btnRegistro = document.getElementById("btn-registro");
  const btnLogout = document.getElementById("btn-logout");

  if (usuarioActual) {
    btnLogin.classList.add("hidden");
    btnRegistro.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    btnLogout.textContent = `Cerrar Sesión (${usuarioActual.nombre} - ${usuarioActual.rol.toUpperCase()})`;
  } else {
    btnLogin.classList.remove("hidden");
    btnRegistro.classList.remove("hidden");
    btnLogout.classList.add("hidden");
  }
  actualizarTablaReservas();
}

// --- Cierre de Sesión ---
function cerrarSesion() {
  usuarioActual = null;
  localStorage.removeItem("usuario_aventura");
  actualizarVistaSesion();
  alert("Sesión cerrada correctamente.");
}

// --- Procesar Reserva ---
function procesarReserva(event) {
  event.preventDefault();
  if (!usuarioActual) {
    alert("Debe iniciar sesión para poder emitir una reserva.");
    abrirModal("modal-login");
    return;
  }

  const select = document.getElementById("select-paquete");
  const cantInput = document.getElementById("cant-pasajeros");
  const idPaquete = parseInt(select.value);
  const cantidad = parseInt(cantInput.value);

  const paquetes = obtenerPaquetes();
  const paquete = paquetes.find(p => p.id === idPaquete);

  if (!paquete) {
    alert("Por favor seleccione un paquete válido.");
    return;
  }

  const todasLasReservas = JSON.parse(localStorage.getItem("todas_las_reservas_aventura")) || [];
  const totalCobrado = paquete.precio * cantidad;

  const nuevaReserva = {
    id: todasLasReservas.length > 0 ? Math.max(...todasLasReservas.map(r => r.id)) + 1 : 1,
    emailCliente: usuarioActual.email,
    cliente: usuarioActual.nombre,
    paquete: paquete.nombre,
    pasajeros: cantidad,
    total: totalCobrado,
    estado: "Confirmada"
  };

  todasLasReservas.push(nuevaReserva);
  localStorage.setItem("todas_las_reservas_aventura", JSON.stringify(todasLasReservas));

  actualizarTablaReservas();
  alert(`Reserva N° ${nuevaReserva.id} emitida con éxito.\nMonto Total: $${totalCobrado.toLocaleString("es-CL")} CLP`);

  document.getElementById("form-reserva").reset();
  calcularTotalReserva();
}

// --- Actualizar Tabla de Reservas ---
function actualizarTablaReservas() {
  const tbody = document.getElementById("tabla-reservas-body");
  tbody.innerHTML = "";

  if (!usuarioActual) {
    tbody.innerHTML = `<tr><td colspan="6">Inicie sesión para ver el historial de reservas.</td></tr>`;
    return;
  }

  const todasLasReservas = JSON.parse(localStorage.getItem("todas_las_reservas_aventura")) || [];
 }

// --- Modales ---
function abrirModal(idModal) {
  document.getElementById(idModal).classList.remove("hidden");
}

function cerrarModal(idModal) {
  document.getElementById(idModal).classList.add("hidden");
}

// --- Registro de Cliente ---
function registrarCliente(event) {
  event.preventDefault();
  const nombre = document.getElementById("reg-nombre").value.trim();
  const email = document.getElementById("reg-email").value.toLowerCase().trim();
  const rut = document.getElementById("reg-rut").value.trim();
  const esAdmin = email.includes("admin");

  usuarioActual = { nombre, email, rut, rol: esAdmin ? "admin" : "cliente" };
  localStorage.setItem("usuario_aventura", JSON.stringify(usuarioActual));

  cerrarModal("modal-registro");
  actualizarVistaSesion();
  alert(`Usuario ${nombre} (${usuarioActual.rol.toUpperCase()}) registrado e iniciado exitosamente.`);
}

// --- Inicio de Sesión ---
function iniciarSesion(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.toLowerCase().trim();
  const nombreLimpio = email.split("@")[0];
  const esAdmin = email.includes("admin");

  usuarioActual = { nombre: nombreLimpio, email, rut: "11.***.***-1", rol: esAdmin ? "admin" : "cliente" };
  localStorage.setItem("usuario_aventura", JSON.stringify(usuarioActual));

  cerrarModal("modal-login");
  actualizarVistaSesion();
  alert(`Bienvenido de nuevo, ${usuarioActual.nombre} (${usuarioActual.rol.toUpperCase()}).`);
}

// --- Estado de Sesión ---
function cargarEstadoSesion() {
  const sesionGuardada = localStorage.getItem("usuario_aventura");
  if (sesionGuardada) {
    usuarioActual = JSON.parse(sesionGuardada);
    actualizarVistaSesion();
  }
}

// --- Vista de Sesión ---
function actualizarVistaSesion() {
  const btnLogin = document.getElementById("btn-login");
  const btnRegistro = document.getElementById("btn-registro");
  const btnLogout = document.getElementById("btn-logout");

  if (usuarioActual) {
    btnLogin.classList.add("hidden");
    btnRegistro.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    btnLogout.textContent = `Cerrar Sesión (${usuarioActual.nombre} - ${usuarioActual.rol.toUpperCase()})`;
  } else {
    btnLogin.classList.remove("hidden");
    btnRegistro.classList.remove("hidden");
    btnLogout.classList.add("hidden");
  }
  actualizarTablaReservas();
}

// --- Cierre de Sesión ---
function cerrarSesion() {
  usuarioActual = null;
  localStorage.removeItem("usuario_aventura");
  actualizarVistaSesion();
  alert("Sesión cerrada correctamente.");
}

// --- Procesar Reserva ---
function procesarReserva(event) {
  event.preventDefault();
  if (!usuarioActual) {
    alert("Debe iniciar sesión para poder emitir una reserva.");
    abrirModal("modal-login");
    return;
  }

  const select = document.getElementById("select-paquete");
  const cantInput = document.getElementById("cant-pasajeros");
  const idPaquete = parseInt(select.value);
  const cantidad = parseInt(cantInput.value);

  const paquetes = obtenerPaquetes();
  const paquete = paquetes.find(p => p.id === idPaquete);

  if (!paquete) {
    alert("Por favor seleccione un paquete válido.");
    return;
  }

  const todasLasReservas = JSON.parse(localStorage.getItem("todas_las_reservas_aventura")) || [];
  const totalCobrado = paquete.precio * cantidad;

  const nuevaReserva = {
    id: todasLasReservas.length > 0 ? Math.max(...todasLasReservas.map(r => r.id)) + 1 : 1,
    emailCliente: usuarioActual.email,
    cliente: usuarioActual.nombre,
    paquete: paquete.nombre,
    pasajeros: cantidad,
    total: totalCobrado,
    estado: "Confirmada"
  };

  todasLasReservas.push(nuevaReserva);
  localStorage.setItem("todas_las_reservas_aventura", JSON.stringify(todasLasReservas));

  actualizarTablaReservas();
  alert(`Reserva N° ${nuevaReserva.id} emitida con éxito.\nMonto Total: $${totalCobrado.toLocaleString("es-CL")} CLP`);

  document.getElementById("form-reserva").reset();
  calcularTotalReserva();
}

// --- Actualizar Tabla de Reservas ---
function actualizarTablaReservas() {
  const tbody = document.getElementById("tabla-reservas-body");
  tbody.innerHTML = "";

  if (!usuarioActual) {
    tbody.innerHTML = `<tr><td colspan="6">Inicie sesión para ver el historial de reservas.</td></tr>`;
    return;
  }

  const todasLasReservas = JSON.parse(localStorage.getItem("todas_las_reservas_aventura")) || [];
const esAdmin = usuarioActual.rol === "admin";
const reservasAVisibilizar = esAdmin ? todasLasReservas : todasLasReservas.filter(r => r.emailCliente === usuarioActual.email);

if (reservasAVisibilizar.length === 0) {
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center">
        ${esAdmin ? "No hay reservas registradas en el sistema." : "No registra reservas emitidas en su cuenta."}
      </td>
    </tr>
  `;
  return;
}

reservasAVisibilizar.forEach(res => {
  const row = document.createElement("tr");

  let tdAccionAdmin = "";
  if (esAdmin) {
    tdAccionAdmin = `<td><button class="btn-danger" onclick="eliminarReserva(${res.id})">Eliminar</button></td>`;
  }

  row.innerHTML = `
    <td>#${res.id}</td>
    <td>${res.paquete} ${esAdmin ? `<br /><small>${res.emailCliente}</small>` : ''}</td>
    <td>${res.pasajeros} persona(s)</td>
    <td>$${res.total.toLocaleString("es-CL")} CLP</td>
    <td><strong>${res.estado}</strong></td>
    ${tdAccionAdmin}
  `;
  tbody.appendChild(row);
});
}
