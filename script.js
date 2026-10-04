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
    card.innerHTML = `
      <h3>${paq.nombre}</h3>
      <p><strong>Fecha Salida:</strong> ${paq.fechaSalida}</p>
      <p><strong>Cupo Disponible:</strong> ${paq.cupo} personas</p>
      <p>$${paq.precio.toLocaleString("es-CL")} CLP <small>(USD $${precioUSD})</small></p>
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

function crearNuevoPaquete(event) {
  event.preventDefault();
  if (!usuarioActual || usuarioActual.rol !== "admin") {
    alert("Acceso denegado: solo administradores pueden crear paquetes.");
    return;
  }
  const nombre = document.getElementById("admin-paquete-nombre").value.trim();
  const fecha = document.getElementById("admin-paquete-fecha").value;
  const precio = parseInt(document.getElementById("admin-paquete-precio").value);
  const cupo = parseInt(document.getElementById("admin-paquete-cupo").value);
  const paquetes = obtenerPaquetes();
  const nuevoPaquete = {
    id: paquetes.length > 0 ? Math.max(...paquetes.map(p => p.id)) + 1 : 1,
    nombre: nombre,
    fechaSalida: fecha,
    precio: precio,
    cupo: cupo
  };
  paquetes.push(nuevoPaquete);
  localStorage.setItem("paquetes_aventura", JSON.stringify(paquetes));
  alert(`Paquete "${nombre}" creado exitosamente.`);
  document.getElementById("form-nuevo-paquete").reset();
  cargarCatalogoPaquetes();
  poblarSelectPaquetes();
  mostrarPaquetesAdmin();
}

function eliminarPaquete(idPaquete) {
  if (!usuarioActual || usuarioActual.rol !== "admin") {
    alert("Acceso denegado: solo administradores pueden eliminar paquetes.");
    return;
  }
  let paquetes = obtenerPaquetes();
  paquetes = paquetes.filter(p => p.id !== idPaquete);
  localStorage.setItem("paquetes_aventura", JSON.stringify(paquetes));
  alert(`Paquete ID ${idPaquete} eliminado correctamente.`);
  cargarCatalogoPaquetes();
  poblarSelectPaquetes();
  mostrarPaquetesAdmin();
}

function mostrarPaquetesAdmin() {
  const tbody = document.getElementById("tabla-paquetes-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const paquetes = obtenerPaquetes();
  paquetes.forEach(paq => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${paq.id}</td>
      <td>${paq.nombre}</td>
      <td>${paq.fechaSalida}</td>
      <td>$${paq.precio.toLocaleString("es-CL")} CLP</td>
      <td>${paq.cupo}</td>
      <td><button onclick="eliminarPaquete(${paq.id})">Eliminar</button></td>
    `;
    tbody.appendChild(row);
  });
}

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

function actualizarTablaReservas() {
  const tbody = document.getElementById("tabla-reservas-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!usuarioActual) {
    tbody.innerHTML = `<tr><td colspan="6">Inicie sesion para ver el historial de reservas.</td></tr>`;
    return;
  }
  const todasLasReservas = JSON.parse(localStorage.getItem("todas_las_reservas_aventura")) || [];
  let reservasAVisibilizar = [];
  const esAdmin = usuarioActual.rol === "admin";
  if (esAdmin) {
    reservasAVisibilizar = todasLasReservas;
  } else {
    reservasAVisibilizar = todasLasReservas.filter(r => r.emailCliente === usuarioActual.email);
  }
  if (reservasAVisibilizar.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">${esAdmin ? "No hay reservas registradas en el sistema." : "No registra reservas emitidas en su cuenta."}</td></tr>`;
    return;
  }
  reservasAVisibilizar.forEach(res => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${res.id}</td>
      <td>${res.paquete} ${esAdmin ? `<br /><small>(${res.emailCliente})</small>` : ''}</td>
      <td>${res.pasajeros}</td>
      <td>$${res.total.toLocaleString("es-CL")} CLP</td>
      <td><strong>${res.estado}</strong></td>
      <td>${esAdmin ? `<button onclick="cambiarEstadoReserva(${res.id})">Modificar</button>` : ''}</td>
    `;
    tbody.appendChild(row);
  });
}

function actualizarVistaSesion() {
  const btnLogin = document.getElementById("btn-login");
  const btnRegistro = document.getElementById("btn-registro");
  const btnLogout = document.getElementById("btn-logout");
  const adminPanel = document.getElementById("admin-panel");
  const clientePanel = document.getElementById("cliente-panel");
  const thAcciones = document.getElementById("th-acciones");

  if (usuarioActual) {
    if (btnLogin) btnLogin.classList.add("hidden");
    if (btnRegistro) btnRegistro.classList.add("hidden");
    if (btnLogout) {
      btnLogout.classList.remove("hidden");
      btnLogout.textContent = `Cerrar Sesion (${usuarioActual.nombre} - ${usuarioActual.rol.toUpperCase()})`;
    }

    if (usuarioActual.rol === "admin") {
      if (adminPanel) adminPanel.classList.remove("hidden");
      if (clientePanel) clientePanel.classList.add("hidden");
      if (thAcciones) thAcciones.classList.remove("hidden");
      mostrarPaquetesAdmin();
    } else {
      if (adminPanel) adminPanel.classList.add("hidden");
      if (clientePanel) clientePanel.classList.remove("hidden");
      if (thAcciones) thAcciones.classList.add("hidden");
    }
  } else {
    if (btnLogin) btnLogin.classList.remove("hidden");
    if (btnRegistro) btnRegistro.classList.remove("hidden");
    if (btnLogout) btnLogout.classList.add("hidden");
    if (adminPanel) adminPanel.classList.add("hidden");
    if (clientePanel) clientePanel.classList.add("hidden");
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

function registrarCliente(event) {
  event.preventDefault();
  const nombre = document.getElementById("reg-nombre").value.trim();
  const email = document.getElementById("reg-email").toLowerCase().trim();
  const rut = document.getElementById("reg-rut").value.trim();
  const esAdmin = email.includes("admin");
  usuarioActual = { nombre: nombre, email: email, rut: rut, rol: esAdmin ? "admin" : "cliente" };
  localStorage.setItem("usuario_aventura", JSON.stringify(usuarioActual));
  cerrarModal("modal-registro");
  actualizarVistaSesion();
  alert(`Usuario ${nombre} (${usuarioActual.rol.toUpperCase()}) registrado e iniciado exitosamente.`);
}

function iniciarSesion(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.toLowerCase().trim();
  const nombreLimpio = email.split("@")[0];
  const esAdmin = email.includes("admin");
  usuarioActual = { nombre: nombreLimpio, email: email, rut: "11.***.***-1", rol: esAdmin ? "admin" : "cliente" };
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

function abrirModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.remove("hidden");
}

function cerrarModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.add("hidden");
}
