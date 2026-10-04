let usuarioActual = null;
let tipoCambioUSD = 950.0; // Valor por defecto en caso de falla de conexión

const destinosDemo = [
  { id: 1, nombre: "Cajon del Maipo", zona: "Region Metropolitana", costo: 45000 },
  { id: 2, nombre: "Salar de Surire", zona: "Region de Arica y Parinacota", costo: 310000 },
  { id: 3, nombre: "Valle del Elqui", zona: "Region de Coquimbo", costo: 120000 },
  { id: 4, nombre: "Parque Conguillio", zona: "Region de La Araucania", costo: 185000 },
  { id: 5, nombre: "San Pedro de Atacama", zona: "Region de Antofagasta", costo: 400000 }
];

const paquetesDemo = [
  { id: 1, nombre: "Escapada Centro-Norte", fechaSalida: "2026-10-24", precio: 426000, cupo: 10 },
  { id: 2, nombre: "Aventura Sur y Lagos", fechaSalida: "2026-11-05", precio: 580000, cupo: 8 },
  { id: 3, nombre: "Ruta del Elqui y Astronomia", fechaSalida: "2026-11-12", precio: 290000, cupo: 12 }
];

let reservasAlmacenadas = [];

// Inicialización al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
  obtenerTipoCambio();
  cargarCatalogoDestinos();
  cargarCatalogoPaquetes();
  poblarSelectPaquetes();
  cargarEstadoSesion();
});

// Consulta a la API para tipo de cambio CLP/USD
async function obtenerTipoCambio() {
  const contenedor = document.getElementById("indicador-dolar");
  try {
    const respuesta = await fetch("https://mindicador.cl/api/dolar");
    if (respuesta.ok) {
      const datos = await respuesta.json();
      tipoCambioUSD = datos.serie[0].valor; // corregido: acceder al primer elemento
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

// Generación dinámica de tarjetas de destinos
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

// Generación dinámica de tarjetas de paquetes
function cargarCatalogoPaquetes() {
  const grid = document.getElementById("grid-paquetes");
  grid.innerHTML = "";
  paquetesDemo.forEach(paq => {
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

// Poblar selector del formulario de reserva
function poblarSelectPaquetes() {
  const select = document.getElementById("select-paquete");
  select.innerHTML = '<option value="">-- Seleccione un Paquete --</option>';
  paquetesDemo.forEach(paq => {
    const option = document.createElement("option");
    option.value = paq.id;
    option.textContent = `${paq.nombre} - $${paq.precio.toLocaleString("es-CL")} CLP`;
    select.appendChild(option);
  });
  select.addEventListener("change", calcularTotalReserva);
}

// Cálculo en tiempo real del monto total por cantidad de personas
function calcularTotalReserva() {
  const select = document.getElementById("select-paquete");
  const cantInput = document.getElementById("cant-pasajeros");
  const spanPrecioUnitario = document.getElementById("resumen-precio-unitario");
  const spanTotal = document.getElementById("resumen-total");

  const idSeleccionado = parseInt(select.value);
  const cantidad = parseInt(cantInput.value) || 1;
  const paquete = paquetesDemo.find(p => p.id === idSeleccionado);

  if (paquete) {
    const total = paquete.precio * cantidad;
    spanPrecioUnitario.textContent = `$${paquete.precio.toLocaleString("es-CL")} CLP`;
    spanTotal.textContent = `$${total.toLocaleString("es-CL")} CLP`;
  } else {
    spanPrecioUnitario.textContent = "$0 CLP";
    spanTotal.textContent = "$0 CLP";
  }
}

// Control de ventanas modales
function abrirModal(idModal) {
  document.getElementById(idModal).classList.remove("hidden");
}

function cerrarModal(idModal) {
  document.getElementById(idModal).classList.add("hidden");
}

// Registro de Cliente
function registrarCliente(event) {
  event.preventDefault();
  const nombre = document.getElementById("reg-nombre").value;
  const email = document.getElementById("reg-email").value;
  const rut = document.getElementById("reg-rut").value;

  usuarioActual = { nombre, email, rut };
  localStorage.setItem("usuario_aventura", JSON.stringify(usuarioActual));

  cerrarModal("modal-registro");
  actualizarVistaSesion();
  alert(`Cliente ${nombre} registrado e iniciado exitosamente.`);
}

// Inicio de Sesión
function iniciarSesion(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value;

  usuarioActual = { nombre: email.split("@")[0], email: email, rut: "11.***.***-1" };
  localStorage.setItem("usuario_aventura", JSON.stringify(usuarioActual));

  cerrarModal("modal-login");
  actualizarVistaSesion();
  alert(`Bienvenido de nuevo, ${usuarioActual.nombre}.`);
}

// Cargar estado de sesión guardado
function cargarEstadoSesion() {
  const sesionGuardada = localStorage.getItem("usuario_aventura");
  if (sesionGuardada) {
    usuarioActual = JSON.parse(sesionGuardada);
    actualizarVistaSesion();
  }
}

// Actualizar botones de sesión en el encabezado
function actualizarVistaSesion() {
  const btnLogin = document.getElementById("btn-login");
  const btnRegistro = document.getElementById("btn-registro");
  const btnLogout = document.getElementById("btn-logout");

  if (usuarioActual) {
    btnLogin.classList.add("hidden");
    btnRegistro.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    btnLogout.textContent = `Cerrar Sesión (${usuarioActual.nombre})`;
  } else {
    btnLogin.classList.remove("hidden");
    btnRegistro.classList.remove("hidden");
    btnLogout.classList.add("hidden");
  }
  actualizarTablaReservas();
}

// Cierre de Sesión
function cerrarSesion() {
  usuarioActual = null;
  localStorage.removeItem("usuario_aventura");
  actualizarVistaSesion();
  alert("Sesión cerrada correctamente.");
}

// Procesar emisión de reserva
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
  const paquete = paquetesDemo.find(p => p.id === idPaquete);

  if (!paquete) {
    alert("Por favor seleccione un paquete válido.");
    return;
  }

  const totalCobrado = paquete.precio * cantidad;
  const nuevaReserva = {
    id: reservasAlmacenadas.length + 1,
    cliente: usuarioActual.nombre,
    paquete: paquete.nombre,
    pasajeros: cantidad,
    total: totalCobrado,
    estado: "Confirmada"
  };

    reservasAlmacenadas.push(nuevaReserva);
  actualizarTablaReservas();

  alert(`Reserva N° ${nuevaReserva.id} emitida con éxito.\nMonto Total: $${totalCobrado.toLocaleString("es-CL")} CLP`);

  document.getElementById("form-reserva").reset();
  calcularTotalReserva();
}

// Actualizar tabla del historial de reservas
function actualizarTablaReservas() {
  const tbody = document.getElementById("tabla-reservas-body");
  tbody.innerHTML = "";

  if (!usuarioActual || reservasAlmacenadas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">
          ${!usuarioActual ? "Inicie sesión para ver su historial de reservas." : "No registra reservas emitidas en esta sesión."}
        </td>
      </tr>
    `;
    return;
  }

  reservasAlmacenadas.forEach(res => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${res.id}</td>
      <td>${res.paquete}</td>
      <td>${res.pasajeros} persona(s)</td>
      <td>$${res.total.toLocaleString("es-CL")} CLP</td>
      <td><strong>${res.estado}</strong></td>
    `;
    tbody.appendChild(row);
  });
}
