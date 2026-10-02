import hashlib
from datetime import date
from typing import List, Optional

class Usuario:
    """Clase base que representa a un usuario del sistema."""
    def __init__(self, id_usuario: int, nombre_completo: str, correo: str, clave_raw: str = None, clave_hash: str = None):
        self._id_usuario = id_usuario
        self._nombre_completo = nombre_completo.strip()
        self._correo = correo.lower().strip()
        
        if clave_hash:
            self._clave_hash = clave_hash
        elif clave_raw:
            self._clave_hash = self._generar_hash(clave_raw)
        else:
            raise ValueError("Debe proporcionar una clave en texto plano o un hash existente.")

    @staticmethod
    def _generar_hash(clave: str) -> str:
        return hashlib.sha256(clave.encode('utf-8')).hexdigest()

    def autenticar(self, clave_ingresada: str) -> bool:
        return self._clave_hash == self._generar_hash(clave_ingresada)

    @property
    def id_usuario(self) -> int:
        return self._id_usuario

    @property
    def nombre_completo(self) -> str:
        return self._nombre_completo

    @property
    def correo(self) -> str:
        return self._correo

    @property
    def clave_hash(self) -> str:
        return self._clave_hash


class Cliente(Usuario):
    """Representa a un cliente del sistema con proteccion de datos sensibles."""
    def __init__(self, id_usuario: int, nombre_completo: str, correo: str, rut: str, telefono: str, 
                 clave_raw: str = None, clave_hash: str = None):
        super().__init__(id_usuario, nombre_completo, correo, clave_raw=clave_raw, clave_hash=clave_hash)
        self._rut = rut.strip()
        self._telefono = telefono.strip()

    @property
    def rut(self) -> str:
        return self._rut

    @property
    def telefono(self) -> str:
        return self._telefono

    def obtener_rut_enmascarado(self) -> str:
        partes = self._rut.split('-')
        if len(partes) == 2:
            num, dv = partes
            if len(num) >= 7:
                return f"{num[:2]}.***.***-{dv}"
        return "**.***.***-*"

    def obtener_telefono_enmascarado(self) -> str:
        if len(self._telefono) >= 8:
            return f"{self._telefono[:4]}****{self._telefono[-4:]}"
        return "+569****0000"


class Destino:
    """Representa un atractivo o servicio turistico cotizado individualmente (Regla R1)."""
    def __init__(self, id_destino: int, nombre: str, zona: str, descripcion: str, 
                 duracion_dias: int, costo_base: float, disponible: bool = True):
        if costo_base <= 0:
            raise ValueError("El costo base del destino debe ser mayor a cero.")

        self._id_destino = id_destino
        self._nombre = nombre.strip()
        self._zona = zona.strip()
        self._descripcion = descripcion.strip()
        self._duracion_dias = int(duracion_dias)
        self._costo_base = float(costo_base)
        self._disponible = disponible

    @property
    def id_destino(self) -> int:
        return self._id_destino

    @property
    def nombre(self) -> str:
        return self._nombre

    @property
    def zona(self) -> str:
        return self._zona

    @property
    def descripcion(self) -> str:
        return self._descripcion

    @property
    def duracion_dias(self) -> int:
        return self._duracion_dias

    @property
    def costo_base(self) -> float:
        return self._costo_base

    @property
    def disponible(self) -> bool:
        return self._disponible

    def deshabilitar(self) -> None:
        self._disponible = False

class Paquete:
    """Estructura comercial que combina entre 2 y 5 destinos y congela el precio publicado."""
    def __init__(self, id_paquete: int, nombre: str, fecha_salida: date, fecha_regreso: date, 
                 cupo_maximo: int, destinos: List[Destino], margen_operacion: float = 0.20, 
                 precio_publicado: Optional[float] = None):
        
        if len(destinos) < 2 or len(destinos) > 5:
            raise ValueError("Un paquete debe incluir entre 2 y 5 destinos sin repetir.")

        if fecha_regreso <= fecha_salida:
            raise ValueError("La fecha de regreso debe ser posterior a la de salida.")

        self._id_paquete = id_paquete
        self._nombre = nombre.strip()
        self._fecha_salida = fecha_salida
        self._fecha_regreso = fecha_regreso
        self._cupo_maximo = int(cupo_maximo)
        self._destinos = destinos
        self._margen_operacion = float(margen_operacion)

        if precio_publicado is not None:
            self._precio_publicado = float(precio_publicado)
        else:
            self._precio_publicado = self.calcular_precio_base()

    @property
    def id_paquete(self) -> int:
        return self._id_paquete

    @property
    def nombre(self) -> str:
        return self._nombre

    @property
    def fecha_salida(self) -> date:
        return self._fecha_salida

    @property
    def fecha_regreso(self) -> date:
        return self._fecha_regreso

    @property
    def cupo_maximo(self) -> int:
        return self._cupo_maximo

    @property
    def destinos(self) -> List[Destino]:
        return self._destinos

    @property
    def precio_publicado(self) -> float:
        return self._precio_publicado

    def calcular_precio_base(self) -> float:
        suma_costos = sum(d.costo_base for d in self._destinos)
        return round(suma_costos * (1.0 + self._margen_operacion), 2)

    def obtener_cupo_disponible(self, reservas_actuales: int) -> int:
        return max(0, self._cupo_maximo - reservas_actuales)

    def es_valido_para_reserva(self) -> bool:
        return self._fecha_salida >= date.today()


class Reserva:
    """Transaccion de compra emitida por un cliente para un paquete especifico."""
    def __init__(self, id_reserva: int, cliente: Cliente, paquete: Paquete, 
                 cantidad_personas: int, fecha_emision: Optional[date] = None, 
                 total_cobrado: Optional[float] = None, estado: str = "Confirmada"):
        
        if cantidad_personas < 1:
            raise ValueError("La cantidad de personas por reserva debe ser al menos 1.")

        if not paquete.es_valido_para_reserva():
            raise ValueError("No se aceptan reservas para paquetes con fecha expirada.")

        self._id_reserva = id_reserva
        self._cliente = cliente
        self._paquete = paquete
        self._cantidad_personas = int(cantidad_personas)
        self._fecha_emision = fecha_emision if fecha_emision else date.today()
        self._estado = estado

        if total_cobrado is not None:
            self._total_cobrado = float(total_cobrado)
        else:
            self._total_cobrado = round(paquete.precio_publicado * cantidad_personas, 2)

    @property
    def id_reserva(self) -> int:
        return self._id_reserva

    @property
    def cliente(self) -> Cliente:
        return self._cliente

    @property
    def paquete(self) -> Paquete:
        return self._paquete

    @property
    def cantidad_personas(self) -> int:
        return self._cantidad_personas

    @property
    def fecha_emision(self) -> date:
        return self._fecha_emision

    @property
    def total_cobrado(self) -> float:
        return self._total_cobrado

    @property
    def estado(self) -> str:
        return self._estado

    def obtener_detalle_reserva(self) -> str:
        return (f"Reserva N°{self._id_reserva} | Cliente: {self._cliente.nombre_completo} "
                f"({self._cliente.obtener_rut_enmascarado()}) | Paquete: {self._paquete.nombre} | "
                f"Personas: {self._cantidad_personas} | Total: ${self._total_cobrado:,.0f}")
