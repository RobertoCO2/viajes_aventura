var usuarioActual = null;
var tipoCambioUSD = 950.0;

// Helper: Verificación Unificada de Rol Administrador
function esUsuarioAdmin() {
  if (!usuarioActual || !usuarioActual.email) return false;
  const rol = String(usuarioActual.rol || "").toLowerCase();
  const email = String(usuarioActual.email || "").toLowerCase().trim();
  return rol === "admin" || email.includes("admin");
}

// Helper: Sanitización XSS (Previene Inyección HTML/JS)
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Datos Semilla (Destinos y Paquetes)
const destinosDemo = [
  { id: 1, nombre: "Cajón del Maipo", zona: "Región Metropolitana", costo: 45000 },
  { id: 2, nombre: "Salar de Surire", zona: "Región de Arica y Parinacota", costo: 310000 },
  { id: 3, nombre: "Valle del Elqui", zona: "Región de Coquimbo", costo: 120000 },
  { id: 4, nombre: "Parque Conguillío", zona: "Región de La Araucanía", costo: 185000 },
  { id: 5, nombre: "San Pedro de Atacama", zona: "Región de Antofagasta", costo: 400000 }
];

const paquetesIniciales = [
  { id: 1, nombre: "Escapada Centro-Norte", fechaSalida: "2026-10-24", precio: 426000, cupo: 10 },
  { id: 2, nombre: "Aventura Sur y Lagos", fechaSalida: "2026-11-05", precio: 580000, cupo: 8 },
  { id: 3, nombre: "Ruta del Elqui y Astronomía", fechaSalida: "2026-11-12", precio: 290000, cupo: 12 }
];

// Inicialización del DOM
document.addEventListener("DOMContentLoaded", () => {
  inicializarPaquetes();
  obtenerTipoCambio();
  cargarCatalogoDestinos();
  cargarCatalogoPaquetes();
  poblarSelectPaquetes();
  cargarEstadoSesion();
});

// Almacenamiento Seguro (localStorage)
function safeStorageGet(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error("Error al leer localStorage:", e);
    return defaultValue;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Error al escribir localStorage:", e);
    return false;
  }
}

function obtenerPaquetes() {
  const creados = safeStorageGet("paquetes_aventura", null);
  if (!creados || !Array.isArray(creados) || creados.length === 0) {
    safeStorageSet("paquetes_aventura", paquetesIniciales);
    return paquetesIniciales;
  }
  return creados;
}

function inicializarPaquetes() {
  obtenerPaquetes();
}

// API Externa Tipo de Cambio USD/CLP
async function obtenerTipoCambio() {
  const contenedor = document.getElementById("indicador-dolar");
  try {
    const respuesta = await fetch("https://mindicador.cl/api/dolar");
    if (respuesta.ok) {
      const datos = await respuesta.json();
      if (datos && datos.serie && datos.serie[0] && datos.serie[0].valor) {
        tipoCambioUSD = parseFloat(datos.serie[0].valor);
        if (contenedor) {
          contenedor.innerText = `Tipo de Cambio Hoy: 1 USD = $${tipoCambioUSD.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CLP`;
        }
      }
    } else {
      throw new Error("Error en respuesta de API");
    }
  } catch (error) {
    if (contenedor) {
      contenedor.innerText = `Tipo de Cambio Estimado: 1 USD = $${tipoCambioUSD.toLocaleString("es-CL")} CLP`;
    }
  }
  cargarCatalogoDestinos();
  cargarCatalogoPaquetes();
}

// Catálogo de Destinos
function cargarCatalogoDestinos() {
  const grid = document.getElementById("grid-destinos");
  if (!grid) return;
  grid.innerHTML = "";
  destinosDemo.forEach(dest => {
    const precioUSD = (dest.costo / tipoCambioUSD).toFixed(2);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${escapeHTML(dest.nombre)}</h3>
      <p><strong>Ubicación:</strong> ${escapeHTML(dest.zona)}</p>
      <p>$${Number(dest.costo).toLocaleString("es-CL")} CLP <small>(USD $${precioUSD})</small></p>
    `;
    grid.appendChild(card);
  });
}
// Catálogo de Paquetes
function cargarCatalogoPaquetes() {
  const grid = document.getElementById("grid-paquetes");
  if (!grid) return;
  grid.innerHTML = "";
  const paquetes = obtenerPaquetes();
  const admin = esUsuarioAdmin();

  paquetes.forEach(paq => {
    const precioUSD = (paq.precio / tipoCambioUSD).toFixed(2);
    const card = document.createElement("div");
    card.className = "card";

    let botonEliminar = "";
    if (admin) {
      botonEliminar = `<button class="btn-eliminar" onclick="eliminarPaquete(${paq.id})">Eliminar</button>`;
    }

    card.innerHTML = `
      <h3>${escapeHTML(paq.nombre)}</h3>
      <p><strong>Fecha Salida:</strong> ${escapeHTML(paq.fechaSalida)}</p>
      <p><strong>Cupo Disponible:</strong> ${parseInt(paq.cupo)} personas</p>
      <p>$${Number(paq.precio).toLocaleString("es-CL")} CLP <small>(USD $${precioUSD})</small></p>
      ${botonEliminar}
    `;
    grid.appendChild(card);
  });
}

// Poblar Selector de Paquetes
function poblarSelectPaquetes() {
  const select = document.getElementById("select-paquete");
  if (!select) return;
  select.innerHTML = '<option value="">-- Seleccione un Paquete --</option>';
  const paquetes = obtenerPaquetes();

  paquetes.forEach(paq => {
    const option = document.createElement("option");
    option.value = paq.id;
    option.textContent = `${paq.nombre} - $${Number(paq.precio).toLocaleString("es-CL")} CLP`;
    select.appendChild(option);
  });

  select.onchange = calcularTotalReserva;
}

// Cálculo Dinámico de Cobro
function calcularTotalReserva() {
  const select = document.getElementById("select-paquete");
  const cantInput = document.getElementById("cant-pasajeros");
  const spanPrecioUnitario = document.getElementById("resumen-precio-unitario");
  const spanTotal = document.getElementById("resumen-total");

  if (!select || !cantInput) return;

  const idSeleccionado = parseInt(select.value);
  const cantidad = Math.max(1, parseInt(cantInput.value) || 1);
  const paquetes = obtenerPaquetes();
  const paquete = paquetes.find(p => p.id === idSeleccionado);

  if (paquete) {
    const total = paquete.precio * cantidad;
    if (spanPrecioUnitario) spanPrecioUnitario.textContent = `$${Number(paquete.precio).toLocaleString("es-CL")} CLP`;
    if (spanTotal) spanTotal.textContent = `$${Number(total).toLocaleString("es-CL")} CLP`;
  } else {
    if (spanPrecioUnitario) spanPrecioUnitario.textContent = "$0 CLP";
    if (spanTotal) spanTotal.textContent = "$0 CLP";
  }
}

// Gestión de Modales
function abrirModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.remove("hidden");
}

function cerrarModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.add("hidden");
}

// Registro de Cliente
function registrarCliente(event) {
  event.preventDefault();
  const nombreInput = document.getElementById("reg-nombre");
  const emailInput = document.getElementById("reg-email");
  const rutInput = document.getElementById("reg-rut");
  const passInput = document.getElementById("reg-password");

  if (!nombreInput || !emailInput || !passInput) return;

  const nombre = nombreInput.value.trim();
  const email = emailInput.value.toLowerCase().trim();
  const rut = rutInput ? rutInput.value.trim() : "";
  const password = passInput.value;

  if (!nombre || !email || !password) {
    alert("Por favor complete todos los campos obligatorios.");
    return;
  }

  if (password.length < 4) {
    alert("La contraseña debe tener al menos 4 caracteres.");
    return;
  }

  const esAdmin = email.includes("admin");
  const usuariosRegistrados = safeStorageGet("usuarios_aventura_db", []);
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
  safeStorageSet("usuarios_aventura_db", usuariosRegistrados);

  usuarioActual = { nombre: nombre, email: email, rut: rut, rol: nuevoUsuario.rol };
  safeStorageSet("usuario_aventura", usuarioActual);

  cerrarModal("modal-registro");
  const formReg = document.getElementById("form-registro");
  if (formReg) formReg.reset();

  actualizarVistaSesion();
  alert(`Usuario ${escapeHTML(nombre)} (${usuarioActual.rol.toUpperCase()}) registrado e iniciado con éxito.`);
}
// Inicio de Sesión
function iniciarSesion(event) {
  event.preventDefault();
  const emailInput = document.getElementById("login-email");
  const passInput = document.getElementById("login-password");
  if (!emailInput || !passInput) return;

  const email = emailInput.value.toLowerCase().trim();
  const password = passInput.value;

  if (!email || !password) {
    alert("Por favor ingrese correo y contraseña.");
    return;
  }

  const usuariosRegistrados = safeStorageGet("usuarios_aventura_db", []);
  const usuarioEncontrado = usuariosRegistrados.find(u => u.email === email);

  if (usuarioEncontrado) {
    if (usuarioEncontrado.password !== password) {
      alert("Contraseña incorrecta. Intente nuevamente.");
      return;
    }
    usuarioActual = {
      nombre: String(usuarioEncontrado.nombre),
      email: usuarioEncontrado.email,
      rut: usuarioEncontrado.rut || "Sin RUT",
      rol: usuarioEncontrado.rol
    };
  } else {
    const nombreLimpio = email.split("@")[0];
    const esAdmin = email.includes("admin");
    usuarioActual = {
      nombre: nombreLimpio,
      email: email,
      rut: "11.***.***-1",
      rol: esAdmin ? "admin" : "cliente"
    };
    usuariosRegistrados.push({ ...usuarioActual, password: password });
    safeStorageSet("usuarios_aventura_db", usuariosRegistrados);
  }

  safeStorageSet("usuario_aventura", usuarioActual);
  cerrarModal("modal-login");

  const formLogin = document.getElementById("form-login");
  if (formLogin) formLogin.reset();

  actualizarVistaSesion();
  alert(`Bienvenido de nuevo, ${escapeHTML(usuarioActual.nombre)} (${usuarioActual.rol.toUpperCase()}).`);
}

// Cargar Estado de Sesión
function cargarEstadoSesion() {
  const sesionGuardada = safeStorageGet("usuario_aventura", null);
  if (sesionGuardada && sesionGuardada.email) {
    let nombreNormalizado = sesionGuardada.nombre;
    if (Array.isArray(nombreNormalizado)) {
      nombreNormalizado = nombreNormalizado[0] || "Usuario";
    }
    usuarioActual = { ...sesionGuardada, nombre: String(nombreNormalizado) };
    actualizarVistaSesion();
  } else {
    usuarioActual = null;
  }
}

// Actualizar Vista de Sesión y Visibilidad de Columnas
function actualizarVistaSesion() {
  const btnLogin = document.getElementById("btn-login");
  const btnRegistro = document.getElementById("btn-registro");
  const btnLogout = document.getElementById("btn-logout");
  const adminPanel = document.getElementById("admin-panel");
  const thAcciones = document.getElementById("th-acciones");
  const admin = esUsuarioAdmin();

  if (usuarioActual && usuarioActual.email) {
    if (btnLogin) btnLogin.classList.add("hidden");
    if (btnRegistro) btnRegistro.classList.add("hidden");
    if (btnLogout) {
      btnLogout.classList.remove("hidden");
      btnLogout.textContent = `Cerrar Sesión (${usuarioActual.nombre} - ${usuarioActual.rol.toUpperCase()})`;
    }
    if (adminPanel) {
      if (admin) adminPanel.classList.remove("hidden");
      else adminPanel.classList.add("hidden");
    }
    if (thAcciones) {
      if (admin) thAcciones.classList.remove("hidden");
      else thAcciones.classList.add("hidden");
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

// Cerrar Sesión
function cerrarSesion() {
  usuarioActual = null;
  localStorage.removeItem("usuario_aventura");
  actualizarVistaSesion();
  alert("Sesión cerrada correctamente.");
}

// Admin: Crear Paquete
function crearNuevoPaquete(event) {
  event.preventDefault();
  if (!esUsuarioAdmin()) {
    alert("Acceso denegado: solo administradores pueden crear paquetes.");
    return;
  }

  const nombreInput = document.getElementById("admin-paquete-nombre");
  const fechaInput = document.getElementById("admin-paquete-fecha");
  const precioInput = document.getElementById("admin-paquete-precio");
  const cupoInput = document.getElementById("admin-paquete-cupo");

  if (!nombreInput || !fechaInput || !precioInput || !cupoInput) return;

  const nombre = nombreInput.value.trim();
  const fecha = fechaInput.value;
  const precio = parseInt(precioInput.value);
  const cupo = parseInt(cupoInput.value);

  if (!nombre || !fecha || isNaN(precio) || precio <= 0 || isNaN(cupo) || cupo <= 0) {
    alert("Por favor ingrese valores válidos en todos los campos.");
    return;
  }

  const paquetes = obtenerPaquetes();
  const nuevoId = paquetes.reduce((max, p) => (p.id > max ? p.id : max), 0) + 1;
  const nuevoPaquete = { id: nuevoId, nombre: nombre, fechaSalida: fecha, precio: precio, cupo: cupo };

  paquetes.push(nuevoPaquete);
  safeStorageSet("paquetes_aventura", paquetes);

  alert(`Paquete "${escapeHTML(nombre)}" creado exitosamente.`);

  const formNuevo = document.getElementById("form-nuevo-paquete");
  if (formNuevo) formNuevo.reset();

  cargarCatalogoPaquetes();
  poblarSelectPaquetes();
}
// Admin: Eliminar Paquete
function eliminarPaquete(idPaquete) {
  if (!esUsuarioAdmin()) return;

  if (confirm("¿Está seguro de que desea eliminar este paquete del catálogo?")) {
    let paquetes = obtenerPaquetes();
    paquetes = paquetes.filter(p => parseInt(p.id) !== parseInt(idPaquete));
    safeStorageSet("paquetes_aventura", paquetes);

    alert("Paquete eliminado del catálogo.");
    cargarCatalogoPaquetes();
    poblarSelectPaquetes();
  }
}

// Admin: Eliminar/Cancelar Reserva
function eliminarReserva(idReserva) {
  if (!esUsuarioAdmin()) return;

  if (confirm(`¿Está seguro de cancelar y borrar la Reserva N° ${idReserva}?`)) {
    let todasLasReservas = safeStorageGet("todas_las_reservas_aventura", []);
    todasLasReservas = todasLasReservas.filter(r => parseInt(r.id) !== parseInt(idReserva));
    safeStorageSet("todas_las_reservas_aventura", todasLasReservas);

    alert("Reserva eliminada con éxito.");
    actualizarTablaReservas();
  }
}

// Procesar Reserva
function procesarReserva(event) {
  event.preventDefault();

  if (!usuarioActual || !usuarioActual.email) {
    alert("Debe iniciar sesión para poder emitir una reserva.");
    abrirModal("modal-login");
    return;
  }

  const select = document.getElementById("select-paquete");
  const cantInput = document.getElementById("cant-pasajeros");

  if (!select || !cantInput) return;

  const valPaquete = select.value;
  if (!valPaquete || valPaquete === "") {
    alert("Por favor seleccione un paquete turístico de la lista.");
    return;
  }

  const idPaquete = parseInt(valPaquete);
  const cantidad = Math.max(1, parseInt(cantInput.value) || 1);

  if (isNaN(idPaquete)) {
    alert("Selección de paquete inválida.");
    return;
  }

  const paquetes = obtenerPaquetes();
  const paquete = paquetes.find(p => p.id === idPaquete);

  if (!paquete) {
    alert("El paquete seleccionado ya no está disponible.");
    return;
  }

  try {
    const todasLasReservas = safeStorageGet("todas_las_reservas_aventura", []);
    const totalCobrado = paquete.precio * cantidad;

    const idsValidos = todasLasReservas
      .map(r => parseInt(r.id))
      .filter(id => !isNaN(id));
    const nuevoId = idsValidos.length > 0 ? Math.max(...idsValidos) + 1 : 1;

    const nombreCliente = String(usuarioActual.nombre || "Cliente");

    const nuevaReserva = {
      id: nuevoId,
      emailCliente: usuarioActual.email.toLowerCase().trim(),
      cliente: nombreCliente,
      paquete: paquete.nombre,
      pasajeros: cantidad,
      total: totalCobrado,
      estado: "Confirmada"
    };

    todasLasReservas.push(nuevaReserva);
    safeStorageSet("todas_las_reservas_aventura", todasLasReservas);

    actualizarTablaReservas();

    alert(`¡Reserva N° ${nuevaReserva.id} emitida con éxito!\nMonto Total: $${Number(totalCobrado).toLocaleString("es-CL")} CLP`);

    const formReserva = document.getElementById("form-reserva");
    if (formReserva) formReserva.reset();

    calcularTotalReserva();
  } catch (error) {
    console.error("Error en procesarReserva:", error);
    alert("Ocurrió un error al guardar la reserva. Intente de nuevo.");
  }
}

// Historial de Reservas Sincronizado y Alineado
function actualizarTablaReservas() {
  const tbody = document.getElementById("tabla-reservas-body");
  const thAcciones = document.getElementById("th-acciones");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!usuarioActual || !usuarioActual.email) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">
          Inicie sesión para ver el historial de reservas.
        </td>
      </tr>
    `;
    return;
  }

  const todasLasReservas = safeStorageGet("todas_las_reservas_aventura", []);
  const emailActual = usuarioActual.email.toLowerCase().trim();
  const admin = esUsuarioAdmin();

  // Sincronizar columna de encabezado según el rol
  if (thAcciones) {
    if (admin) thAcciones.classList.remove("hidden");
    else thAcciones.classList.add("hidden");
  }

  let reservasAVisibilizar = [];
  if (admin) {
    reservasAVisibilizar = todasLasReservas;
  } else {
    reservasAVisibilizar = todasLasReservas.filter(r =>
      r.emailCliente && String(r.emailCliente).toLowerCase().trim() === emailActual
    );
  }

  if (reservasAVisibilizar.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">
          ${admin ? "No hay reservas registradas en el sistema." : "No registra reservas emitidas en su cuenta."}
        </td>
      </tr>
    `;
    return;
  }

  reservasAVisibilizar.forEach(res => {
    const row = document.createElement("tr");

    const id = parseInt(res.id) || 0;
    const paquete = escapeHTML(res.paquete || "");
    const emailCliente = escapeHTML(res.emailCliente || "");
    const pasajeros = parseInt(res.pasajeros) || 1;
    const total = Number(res.total || 0).toLocaleString("es-CL");
    const estado = escapeHTML(res.estado || "Confirmada");

    const infoCliente = (admin && emailCliente) ? `<br /><small>(${emailCliente})</small>` : '';

    let colsHtml = `
      <td>#${id}</td>
      <td>${paquete}${infoCliente}</td>
      <td>${pasajeros} persona(s)</td>
      <td>$${total} CLP</td>
      <td><strong>${estado}</strong></td>
    `;

    if (admin) {
      colsHtml += `<td><button class="btn-eliminar" onclick="eliminarReserva(${id})">Eliminar</button></td>`;
    }

    row.innerHTML = colsHtml;
    tbody.appendChild(row);
    });
}