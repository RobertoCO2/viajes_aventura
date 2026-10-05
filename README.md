#  Agencia de Viajes Aventura - Sistema Integral de Gestión y Reservas

![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?style=flat&logo=vercel)
![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat&logo=python)
![SQLite3](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-green)

Sistema informático desarrollado para la agencia **Viajes Aventura**, diseñado bajo los principios de la **Programación Orientada a Objetos (POO)** y arquitectura de software desacoplada en dos capas: un **Backend de Consola** (Python + SQLite) y una **Plataforma Web Interactiva** (HTML5, CSS3, JavaScript ES6) integrada con consumo de servicios API en tiempo real y desplegada en la nube mediante **Vercel**.

---

##  Arquitectura del Proyecto

El sistema se estructura siguiendo el **Principio de Responsabilidad Única (SRP)** para garantizar alta cohesión, bajo acoplamiento y mantenimiento escalable.

```
├──  Backend Consola (Python 3 & SQLite)
│   ├── modelos.py       # Dominios de clase POO (Usuario, Cliente, Administrador, Paquete, Destino, Reserva)
│   ├── base_datos.py    # Capa de persistencia SQLite3 (CRUD, Transacciones y Consultas Parametrizadas)
│   └── main.py          # Interfaz de consola e interactividad por roles
│
├──  Frontend Web (Plataforma Cliente / Administrador)
│   ├── index.html       # Estructura semántica, formularios modales y claves enmascaradas
│   ├── styles.css       # Estilos visuales, Banner Hero, Grid de tarjetas y tablas alineadas
│   └── script.js        # Motor interactivo, consumo API USD/CLP, RBAC y sanitización XSS
│
└──  Documentación y Configuración
    ├── informe_tecnico_viajes_aventura.docx  # Informe Técnico de Arquitectura y Rúbrica
    └── README.md                              # Documentación del Repositorio
```

---

##  Características Principales

### 1. Programación Orientada a Objetos (POO)
 **Herencia**: Jerarquía de clases con superclase `Usuario` y subclases `Cliente` y `Administrador`.
 **Encapsulamiento**: Métodos de acceso y protección de datos sensibles (RUT, credenciales).
 **Relaciones Avanzadas**: Agregación entre `Paquete` y `Destino`; Composición entre `Reserva`, `Cliente` y `Paquete`.

### 2. Seguridad y Protección de Datos
 **Prevención de SQL Injection**: Consultas parametrizadas mediante marcadores de posición (`?`) en la capa de persistencia `SQLite3`.
 **Protección contra XSS (Cross-Site Scripting)**: Sanitización mediante la función `escapeHTML()` antes de renderizar dinámicamente datos en el DOM.
 **Autenticación con Clave Enmascarada**: Formularios web protegidos con `type="password"` que ocultan las credenciales (`••••••••`).
 **Control de Acceso Basado en Roles (RBAC)**: 
   **Cliente**: Explora catálogo, calcula reservas y visualiza aisladamente sólo su propio historial de compras.
   **Administrador**: Habilita el panel de publicación/eliminación de paquetes y la gestión/cancelación global de reservas.

### 3. Integración con Servicios Externos (API REST)
 Consumo asíncrono (`fetch`) a la API de **`mindicador.cl`** para obtener el tipo de cambio USD/CLP en tiempo real.
 **Degradación Suave (Fallback)**: En caso de desconexión o falla de la API externa, el sistema utiliza una tasa estática de respaldo ($950 CLP) garantizando la continuidad operativa.

---

## 🛠️ Tecnologías Utilizadas

 **Lenguajes**: Python 3.12, JavaScript (ES6+), HTML5, CSS3.
 **Base de Datos**: SQLite3 (Persistencia Relacional en archivo `.db`).
 **API REST**: MiIndicador.cl (Divisas).
 **Despliegue & CI/CD**: Vercel & GitHub Actions.
 **Metodología**: Scrum (Product Backlog, Sprints, Historias de Usuario) y Priorización MoSCoW.

---

##  Guía de Ejecución Local

### Backend de Consola (Python)
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TU-USUARIO/viajes-aventura.git
   cd viajes-aventura
   ```
2. Ejecutar la aplicación principal:
   ```bash
   python main.py
   ```

### Plataforma Web
1. Abrir el archivo `index.html` directamente en cualquier navegador web moderno, o utilizar la extensión **Live Server** en VS Code.
2. O acceder directamente a la versión publicada en la nube a través del enlace desplegado en **Vercel**.

---

##  Roles de Prueba Web

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@viajesaventura.cl` | `admin123` | Publicar paquetes, eliminar del catálogo, ver y cancelar todas las reservas |
| **Cliente** | `jperez@email.com` | `1234` | Ver catálogo, cotizar en USD/CLP, reservar y ver únicamente su historial |

---

##  Licencia y Uso Académico

Este proyecto ha sido desarrollado como Evaluación Sumativa Final para la asignatura de **Programación Orientada a Objetos Seguro**. Todos los derechos reservados © 2026 Agencia de Viajes Aventura.
