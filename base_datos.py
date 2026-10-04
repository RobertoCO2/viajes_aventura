import sqlite3
from typing import List, Optional
from modelos import Cliente, Administrador, Destino, Paquete, Reserva


class BaseDatos:
    """Clase encargada de la persistencia de datos relacionales mediante SQLite3."""

    def __init__(self, db_name: str = "viajes_aventura.db"):
        self.db_name = db_name
        self.crear_tablas()
        self.inicializar_administrador_defecto()

    def obtener_conexion(self):
        """Devuelve una conexión a la base de datos con soporte de llaves foráneas activo."""
        conn = sqlite3.connect(self.db_name)
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def crear_tablas(self):
        """Crea la estructura de tablas relacionales e implementa auto-migración."""
        with self.obtener_conexion() as conn:
            conn.execute("PRAGMA foreign_keys = OFF;")
            cursor = conn.cursor()

            # Auto-migración si existen tablas antiguas obsoletas
            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='paquetes';")
            row_p = cursor.fetchone()
            if row_p and 'precio_publicado' not in row_p[0]:
                cursor.execute("DROP TABLE IF EXISTS reservas;")
                cursor.execute("DROP TABLE IF EXISTS paquetes;")

            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='reservas';")
            row_r = cursor.fetchone()
            if row_r and 'clientes' in row_r[0]:
                cursor.execute("DROP TABLE IF EXISTS reservas;")

            # Creación de tablas actualizadas
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usuarios (
                    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    clave_hash TEXT NOT NULL,
                    nombre TEXT NOT NULL,
                    rol TEXT NOT NULL DEFAULT 'cliente',
                    rut TEXT,
                    telefono TEXT
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS destinos (
                    id_destino INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    zona TEXT NOT NULL,
                    descripcion TEXT NOT NULL,
                    duracion_dias INTEGER NOT NULL,
                    costo_base REAL NOT NULL,
                    disponible INTEGER DEFAULT 1
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS paquetes (
                    id_paquete INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    fecha_salida TEXT NOT NULL,
                    fecha_regreso TEXT NOT NULL,
                    cupo_maximo INTEGER NOT NULL,
                    precio_publicado REAL NOT NULL
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reservas (
                    id_reserva INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_usuario INTEGER NOT NULL,
                    id_paquete INTEGER NOT NULL,
                    cantidad_personas INTEGER NOT NULL,
                    fecha_salida TEXT NOT NULL,
                    monto_total_congelado REAL NOT NULL,
                    estado TEXT NOT NULL DEFAULT 'Confirmada',
                    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
                    FOREIGN KEY (id_paquete) REFERENCES paquetes(id_paquete)
                );
            """)

            conn.commit()

    def inicializar_administrador_defecto(self):
        """Crea la cuenta de Administrador por defecto si no existe en la base de datos."""
        admin_email = "admin@viajesaventura.cl"
        if not self.obtener_usuario_por_email(admin_email):
            admin_obj = Administrador(0, "Administrador General", admin_email, clave_raw="admin123")
            query = "INSERT INTO usuarios (email, clave_hash, nombre, rol) VALUES (?, ?, ?, ?)"
            with self.obtener_conexion() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (
                    admin_obj.correo,
                    admin_obj.clave_hash,
                    admin_obj.nombre_completo,
                    "admin"
                ))
                conn.commit()

    # --- CRUD USUARIOS / CLIENTES ---
    def registrar_cliente(self, cliente: Cliente) -> int:
        query = """
            INSERT INTO usuarios (email, clave_hash, nombre, rol, rut, telefono)
            VALUES (?, ?, ?, 'cliente', ?, ?)
        """
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (
                cliente.correo,
                cliente.clave_hash,
                cliente.nombre_completo,
                cliente.rut,
                cliente.telefono
            ))
            conn.commit()
            return cursor.lastrowid

    def obtener_usuario_por_email(self, email: str) -> Optional[dict]:
        query = """
            SELECT id_usuario, email, clave_hash, nombre, rol, rut, telefono
            FROM usuarios
            WHERE lower(email) = ?
        """
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (email.lower().strip(),))
            row = cursor.fetchone()
            if row:
                return {
                    "id_usuario": int(row[0]),
                    "email": row[1],
                    "clave_hash": row[2],
                    "nombre": row[3],
                    "rol": row[4],
                    "rut": row[5],
                    "telefono": row[6]
                }
        return None

    # --- CRUD DESTINOS ---
    def guardar_destino(self, destino: Destino) -> int:
        query = """
            INSERT INTO destinos (nombre, zona, descripcion, duracion_dias, costo_base, disponible)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (
                destino.nombre,
                destino.zona,
                destino.descripcion,
                destino.duracion_dias,
                destino.costo_base,
                1 if destino.disponible else 0
            ))
            conn.commit()
            return cursor.lastrowid

    def obtener_todos_los_destinos(self) -> List[Destino]:
        query = """
            SELECT id_destino, nombre, zona, descripcion, duracion_dias, costo_base, disponible
            FROM destinos
        """
        destinos = []
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            for row in cursor.fetchall():
                destinos.append(Destino(
                    row[0], row[1], row[2], row[3], row[4], row[5], bool(row[6])
                ))
        return destinos

    def obtener_destino_por_id(self, id_destino: int) -> Optional[Destino]:
        query = """
            SELECT id_destino, nombre, zona, descripcion, duracion_dias, costo_base, disponible
            FROM destinos
            WHERE id_destino = ?
        """
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (id_destino,))
            row = cursor.fetchone()
            if row:
                return Destino(row[0], row[1], row[2], row[3], row[4], row[5], bool(row[6]))
        return None

    def actualizar_destino(self, id_destino: int, nombre: str, costo_base: float, disponible: bool) -> bool:
        query = "UPDATE destinos SET nombre = ?, costo_base = ?, disponible = ? WHERE id_destino = ?"
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (nombre, costo_base, 1 if disponible else 0, id_destino))
            conn.commit()
            return cursor.rowcount > 0

    def eliminar_o_desactivar_destino(self, id_destino: int) -> str:
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE destinos SET disponible = 0 WHERE id_destino = ?", (id_destino,))
            conn.commit()
            return "desactivado"

    # --- CRUD PAQUETES ---
    def guardar_paquete(self, paquete: Paquete) -> int:
        query = """
            INSERT INTO paquetes (nombre, fecha_salida, fecha_regreso, cupo_maximo, precio_publicado)
            VALUES (?, ?, ?, ?, ?)
        """
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (
                paquete.nombre,
                str(paquete.fecha_salida),
                str(paquete.fecha_regreso),
                paquete.cupo_maximo,
                paquete.precio_publicado
            ))
            conn.commit()
            return cursor.lastrowid

    def obtener_todos_los_paquetes(self) -> List[dict]:
        query = """
            SELECT id_paquete, nombre, fecha_salida, fecha_regreso, cupo_maximo, precio_publicado
            FROM paquetes
            ORDER BY id_paquete ASC
        """
        paquetes = []
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            for row in cursor.fetchall():
                paquetes.append({
                    "id_paquete": int(row[0]),
                    "nombre": row[1],
                    "fecha_salida": row[2],
                    "fecha_regreso": row[3],
                    "cupo_maximo": int(row[4]),
                    "precio_publicado": float(row[5])
                })
        return paquetes

    def eliminar_paquete(self, id_paquete: int) -> bool:
        query = "DELETE FROM paquetes WHERE id_paquete = ?"
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (id_paquete,))
            conn.commit()
            return cursor.rowcount > 0

        # --- CRUD RESERVAS Y CONTROL DE CUPO ---
    def obtener_cupo_reservado_paquete(self, id_paquete: int) -> int:
        query = """
            SELECT SUM(cantidad_personas)
            FROM reservas
            WHERE id_paquete = ? AND estado != 'Cancelada'
        """
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (id_paquete,))
            row = cursor.fetchone()
            return int(row[0]) if row and row[0] is not None else 0

    def guardar_reserva(self, reserva: Reserva) -> int:
        query = """
            INSERT INTO reservas (
                id_usuario,
                id_paquete,
                cantidad_personas,
                fecha_salida,
                monto_total_congelado,
                estado
            ) VALUES (?, ?, ?, ?, ?, ?)
        """
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (
                int(reserva._cliente.id_usuario),
                int(reserva._paquete.id_paquete),
                int(reserva._cantidad_personas),
                str(reserva._paquete.fecha_salida),
                float(reserva.total_cobrado),
                str(reserva.estado)
            ))
            conn.commit()
            return cursor.lastrowid

    def obtener_reservas_por_cliente(self, id_usuario: int) -> list:
        query = """
            SELECT r.id_reserva, p.nombre AS paquete_nombre,
                   r.cantidad_personas, r.monto_total_congelado,
                   r.fecha_salida, r.estado
            FROM reservas r
            JOIN paquetes p ON r.id_paquete = p.id_paquete
            WHERE r.id_usuario = ?
        """
        reservas = []
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (id_usuario,))
            for row in cursor.fetchall():
                reservas.append({
                    "id_reserva": int(row[0]),
                    "paquete_nombre": row[1],
                    "cantidad_personas": int(row[2]),
                    "monto_total_congelado": float(row[3]),
                    "fecha_salida": row[4],
                    "estado": row[5]
                })
        return reservas

    def obtener_todas_las_reservas(self) -> list:
        query = """
            SELECT r.id_reserva, u.nombre AS cliente_nombre,
                   p.nombre AS paquete_nombre, r.cantidad_personas,
                   r.monto_total_congelado, r.fecha_salida, r.estado
            FROM reservas r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            JOIN paquetes p ON r.id_paquete = p.id_paquete
        """
        reservas = []
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            for row in cursor.fetchall():
                reservas.append({
                    "id_reserva": int(row[0]),
                    "cliente_nombre": row[1],
                    "paquete_nombre": row[2],
                    "cantidad_personas": int(row[3]),
                    "monto_total_congelado": float(row[4]),
                    "fecha_salida": row[5],
                    "estado": row[6]
                })
        return reservas

    def actualizar_estado_reserva(self, id_reserva: int, nuevo_estado: str) -> bool:
        query = "UPDATE reservas SET estado = ? WHERE id_reserva = ?"
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (nuevo_estado, id_reserva))
            conn.commit()
            return cursor.rowcount > 0

    def eliminar_reserva(self, id_reserva: int) -> bool:
        query = "DELETE FROM reservas WHERE id_reserva = ?"
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (id_reserva,))
            conn.commit()
            return cursor.rowcount > 0
