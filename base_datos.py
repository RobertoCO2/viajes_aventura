
import sqlite3
from datetime import date
from typing import List, Optional
from modelos import Cliente, Destino, Paquete, Reserva


class BaseDatos:

    def __init__(self, db_name: str = "viajes_aventura.db"):
        self.db_name = db_name
        self.crear_tablas()

    def obtener_conexion(self):
        """Devuelve una conexión a la base de datos con soporte de llaves foráneas activo."""
        conn = sqlite3.connect(self.db_name)
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    
    def crear_tablas(self):
        """Crea la estructura de tablas relacionales de la agencia si no existen."""
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()

            # Tabla Usuarios / Clientes
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS clientes (
                    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre_completo TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    rut TEXT UNIQUE NOT NULL,
                    telefono TEXT NOT NULL,
                    clave_hash TEXT NOT NULL
                );
            """)

            # Tabla Destinos 
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS destinos (
                    id_destino INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL UNIQUE,
                    zona TEXT NOT NULL,
                    descripcion TEXT NOT NULL,
                    duracion_dias INTEGER NOT NULL,
                    costo_base REAL NOT NULL,
                    disponible INTEGER NOT NULL DEFAULT 1
                );
            """)

            # Tabla Paquetes
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

            # Tabla Intermedia Paquete_Destino
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS paquete_destino (
                    id_paquete INTEGER NOT NULL,
                    id_destino INTEGER NOT NULL,
                    PRIMARY KEY (id_paquete, id_destino),
                    FOREIGN KEY (id_paquete) REFERENCES paquetes(id_paquete) ON DELETE CASCADE,
                    FOREIGN KEY (id_destino) REFERENCES destinos(id_destino) ON DELETE RESTRICT
                );
            """)

            # Tabla Reservas
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reservas (
                    id_reserva INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_usuario INTEGER NOT NULL,
                    id_paquete INTEGER NOT NULL,
                    cantidad_personas INTEGER NOT NULL,
                    fecha_emision TEXT NOT NULL,
                    total_cobrado REAL NOT NULL,
                    estado TEXT NOT NULL,
                    FOREIGN KEY (id_usuario) REFERENCES clientes(id_usuario),
                    FOREIGN KEY (id_paquete) REFERENCES paquetes(id_paquete)
                );
            """)

            conn.commit()

    def registrar_cliente(self, cliente: Cliente) -> int:
        """Guarda un nuevo cliente en la base de datos usando consultas parametrizadas."""
        query = """
            INSERT INTO clientes (nombre_completo, email, rut, telefono, clave_hash)
            VALUES (?, ?, ?, ?, ?)
        """
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (cliente.nombre_completo, cliente.correo, cliente.rut, cliente.telefono, cliente.clave_hash))
            conn.commit()
            cliente._id_usuario = cursor.lastrowid
            return cursor.lastrowid

    def obtener_cliente_por_email(self, email: str) -> Optional[dict]:
        """Obtiene los datos de un cliente por su correo electrónico."""
        query = "SELECT id_usuario, nombre_completo, email, rut, telefono, clave_hash FROM clientes WHERE email = ?"
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (email.lower().strip(),))
            row = cursor.fetchone()
            if row:
                return {
                    "id_usuario": row[0],
                    "nombre_completo": row[1],
                    "email": row[2],
                    "rut": row[3],
                    "telefono": row[4],
                    "clave_hash": row[5]
                }
            return None

    def guardar_destino(self, destino: Destino) -> int:
        """Registra un destino turístico en el catálogo."""
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
            destino._id_destino = cursor.lastrowid
            return cursor.lastrowid

    def obtener_todos_los_destinos(self) -> List[Destino]:
        """Obtiene la lista completa de destinos registrados."""
        query = "SELECT id_destino, nombre, zona, descripcion, duracion_dias, costo_base, disponible FROM destinos"
        destinos = []
        with self.obtener_conexion() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            for row in rows:
                destinos.append(Destino(row[0], row[1], row[2], row[3], row[4], row[5], bool(row[6])))
        return destinos

  