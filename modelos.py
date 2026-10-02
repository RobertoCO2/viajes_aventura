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

