"""
Módulo 3: main.py
Programa Principal con Menú Interactivo de Consola.
Caso de Estudio: Agencia Viajes Aventura
"""
import sys 
import time
from datetime import date, timedelta
from typing import List, Optional
import getpass
from modelos import Cliente, Destino, Paquete, Reserva
from base_datos import BaseDatos

# --- FUNCIÓN DE LECTURA DE CONTRASEÑA ENMASCARADA ---
def leer_clave_efecto_mascara(prompt: str = "Contraseña: ") -> str:
    """
    Lee la contraseña por consola mostrando brevemente cada carácter (0.3s)
    antes de convertirlo en un '#', manteniendo la máscara '######' en pantalla.
    """
    try:
        import msvcrt, sys, time
        print(prompt, end="", flush=True)
        clave = ""
        while True:
            ch = msvcrt.getch()
            if ch in (b"\r", b"\n"):  # Presionó Enter
                print()
                break
            elif ch == b"\x08":  # Backspace
                if len(clave) > 0:
                    clave = clave[:-1]
                    sys.stdout.write("\b \b")
                    sys.stdout.flush()
            elif ch == b"\x03":  # Ctrl + C
                raise KeyboardInterrupt
            else:
                try:
                    char_str = ch.decode("utf-8")
                    clave += char_str
                    sys.stdout.write(char_str)
                    sys.stdout.flush()
                    time.sleep(0.3)
                    sys.stdout.write("\b#")
                    sys.stdout.flush()
                except UnicodeDecodeError:
                    pass
        return clave
    except ImportError:
        import getpass
        return getpass.getpass(prompt)
    
def ejecutar_menu_cliente(db: BaseDatos, cliente_actual: Cliente) -> tuple:
    print("\n" + "="*50)
    print(" AGENCIA DE VIAJES AVENTURA - SISTEMA DE RESERVAS")
    print("="*50)
    print(f"Sesión activa: {cliente_actual.nombre_completo}")
    print("1. Ver Catálogo de Destinos")
    print("2. Armar y Reservar Paquete Personalizado")
    print("3. Ver Historial de Mis Reservas")
    print("4. Cerrar Sesión")
    print("5. Salir")

    opcion = input("\nSeleccione una opción (1-5): ").strip()

    if opcion == "1":
        mostrar_catalogo_visita(db)
        return cliente_actual, False
    elif opcion == "2":
        try:
            destinos_elegidos = seleccionar_destinos_por_ids(db)
            if not destinos_elegidos:
                return cliente_actual, False

            nombre_paquete = input("Nombre comercial para su Paquete: ").strip() or "Paquete Personalizado"
            cant_personas = leer_entero("¿Para cuántas personas desea reservar?: ", min_val=1)
            fecha_salida = date.today() + timedelta(days=15)
            fecha_regreso = fecha_salida + timedelta(days=5)

        # 1. Crear y guardar el paquete
            paquete_tmp = Paquete(0, nombre_paquete, fecha_salida, fecha_regreso, 10, destinos_elegidos)
            id_paq = db.guardar_paquete(paquete_tmp)
            paquete = Paquete(id_paq, nombre_paquete, fecha_salida, fecha_regreso, 10, destinos_elegidos)

        # 2. Crear y guardar la reserva
            reserva = Reserva(0, cliente_actual, paquete, cant_personas)
            id_reserva = db.guardar_reserva(reserva)

            print("\n¡RESERVA EMITIDA Y CONFIRMADA EXITOSAMENTE!")
            print(f"Reserva N°{id_reserva} | Total: ${reserva.monto_total_congelado:,.0f}")
        except Exception as e:
            print(f"\nOcurrió un inconveniente al procesar la reserva: {e}")
        input("\nPresione solo Enter para continuar...")
        return cliente_actual, False

    elif opcion == "3":
        print("\n--- HISTORIAL DE MIS RESERVAS ---")
        reservas = db.obtener_reservas_por_cliente(cliente_actual.id_usuario)
        if not reservas:
            print("Usted no registra reservas actualmente en el sistema.")
        else:
            for r in reservas:
                print(f"Reserva N°{r['id_reserva']} | Paquete: {r['paquete_nombre']} | "
                      f"Personas: {r['cantidad_personas']} | Total: ${r['monto_total_congelado']:,.0f} | "
                      f"Fecha: {r['fecha_salida']} | Estado: {r['estado']}")
        input("\nPresione solo Enter para continuar...")
        return cliente_actual, False

    elif opcion == "4":
        print("\nSesión cerrada correctamente.")
        input("\nPresione solo Enter para continuar...")
        return None, False

    elif opcion == "5":
        print("\nGracias por utilizar el sistema de Viajes Aventura.")
        return None, True

    else:
        print("\nOpción no válida.")
        input("\nPresione solo Enter para continuar...")
        return cliente_actual, False

    
def leer_entero(mensaje: str, min_val: Optional[int] = None, max_val: Optional[int] = None) -> int:
    while True:
        try:
            valor = int(input(mensaje).strip())
            if min_val is not None and valor < min_val:
                print(f"El valor ingresado debe ser mayor o igual a {min_val}.")
                continue
            if max_val is not None and valor > max_val:
                print(f"El valor ingresado debe ser menor o igual a {max_val}.")
                continue
            return valor
        except ValueError:
            print("Entrada no válida. Por favor, ingrese un número entero.")


def leer_flotante(mensaje: str, min_val: Optional[float] = None) -> float:
    while True:
        try:
            valor = float(input(mensaje).strip())
            if min_val is not None and valor < min_val:
                print(f"El valor ingresado debe ser mayor o igual a {min_val}.")
                continue
            return valor
        except ValueError:
            print("Entrada no válida. Por favor, ingrese un número decimal válido.")


def seleccionar_destinos_por_ids(db: BaseDatos) -> Optional[List[Destino]]:
    destinos_disponibles = [d for d in db.obtener_todos_los_destinos() if d.disponible]
    if len(destinos_disponibles) < 2:
        print("No existen suficientes destinos disponibles (mínimo 2).")
        return None

    print("\nDestinos disponibles:")
    for d in destinos_disponibles:
        print(f"ID #{d.id_destino}: {d.nombre} ({d.zona}) - ${d.costo_base:,.0f}")

    while True:
        raw_ids = input("\nIngrese los ID separados por comas (o 'cancelar' para volver): ").strip()
        if raw_ids.lower() == "cancelar":
            return None

        ids_ingresados = []
        for parte in raw_ids.split(","):
            parte_clean = parte.strip().lower()
            if parte_clean.startswith("id #") and parte_clean[4:].isdigit():
                ids_ingresados.append(int(parte_clean[4:]))
            elif parte_clean.isdigit():
                ids_ingresados.append(int(parte_clean))
            else:
                for d in destinos_disponibles:
                    if parte_clean == d.nombre.lower():
                        ids_ingresados.append(d.id_destino)

        ids_unicos = list(dict.fromkeys(ids_ingresados))

        if len(ids_unicos) < 2 or len(ids_unicos) > 5:
            print("Debe seleccionar entre 2 y 5 destinos distintos.")
            continue

        destinos_seleccionados = []
        error = False
        for id_d in ids_unicos:
            dest = db.obtener_destino_por_id(id_d)
            if dest and dest.disponible:
                destinos_seleccionados.append(dest)
            else:
                print(f"El destino con ID #{id_d} no existe o no está disponible.")
                error = True
                break
        if not error:
            return destinos_seleccionados


def inicializar_datos_demo(db: BaseDatos):
    destinos = db.obtener_todos_los_destinos()
    if not destinos:
        db.guardar_destino(Destino(0, "Cajón del Maipo", "Región Metropolitana", "Trekking y termas", 1, 45000.0))
        db.guardar_destino(Destino(0, "Salar de Surire", "Región de Arica y Parinacota", "Altiplano y fauna", 3, 310000.0))
        db.guardar_destino(Destino(0, "Valle del Elqui", "Región de Coquimbo", "Observación astronómica", 2, 120000.0))
        db.guardar_destino(Destino(0, "Parque Conguillío", "Región de La Araucanía", "Bosque de araucarias", 3, 185000.0))


def mostrar_catalogo_visita(db: BaseDatos):
    print("\n--- CATALOGO DE DESTINOS DISPONIBLES ---")
    destinos = db.obtener_todos_los_destinos()
    if not destinos:
        print("No hay destinos registrados.")
    else:
        for d in destinos:
            estado = "Disponible" if d.disponible else "No disponible"
            print(f"ID #{d.id_destino}: {d.nombre} ({d.zona}) | {d.duracion_dias} días | ${d.costo_base:,.0f} | {estado}")
    input("\nPresione solo Enter para continuar...")

def ejecutar_menu_visitante(db: BaseDatos) -> tuple:
    print("\n" + "="*50)
    print(" AGENCIA DE VIAJES AVENTURA - SISTEMA DE RESERVAS")
    print("="*50)
    print("1. Explorar Catálogo")
    print("2. Iniciar Sesión como Cliente")
    print("3. Registrarse como Cliente")
    print("4. Acceso Administrador")
    print("5. Salir")

    opcion = input("\nSeleccione una opción (1-5): ").strip()

    if opcion == "1":
        mostrar_catalogo_visita(db)
        return None, False, False

    elif opcion == "2":
        email = input("Correo electrónico: ").strip()
        clave = leer_clave_efecto_mascara("Contraseña: ").strip()
        datos = db.obtener_cliente_por_email(email)
        if datos:
            cliente_tmp = Cliente(
                datos["id_usuario"],
                datos["nombre_completo"],
                datos["email"],
                datos["rut"],
                datos["telefono"],
                clave_hash=datos["clave_hash"]
            )
            if cliente_tmp.autenticar(clave):
                return cliente_tmp, False, False
            else:
                print("Contraseña incorrecta.")
        else:
            print("No existe una cuenta registrada con ese correo.")
        input("\nPresione solo Enter para continuar...")
        return None, False, False

    elif opcion == "3":
        try:
            nombre = input("Nombre completo: ").strip()
            if len(nombre) < 3:
                print("El nombre completo debe tener al menos 3 caracteres.")
                input("\nPresione solo Enter para continuar...")
                return None, False, False
            email = input("Correo electrónico: ").strip()
            rut = input("RUT: ").strip()
            telefono = input("Teléfono: ").strip()
            clave = leer_clave_efecto_mascara("Contraseña (mínimo 6 caracteres): ").strip()
            if len(clave) < 6:
                print("La contraseña debe tener un mínimo de 6 caracteres.")
                input("\nPresione solo Enter para continuar...")
                return None, False, False
            cliente_nuevo = Cliente(0, nombre, email, rut, telefono, clave_raw=clave)
            db.registrar_cliente(cliente_nuevo)
            print("Cliente registrado exitosamente.")
        except Exception:
            print("Error al registrar cliente.")
        input("\nPresione solo Enter para continuar...")
        return None, False, False

    elif opcion == "4":
        clave_admin = leer_clave_efecto_mascara("Clave de administración: ").strip()
        if clave_admin == "admin123":
            return None, True, False
        else:
            print("Clave incorrecta.")
        input("\nPresione solo Enter para continuar...")
        return None, False, False

    elif opcion == "5":
        print("Gracias por utilizar el sistema.")
        return None, False, True

    else:
        print("Opción no válida.")
        input("\nPresione solo Enter para continuar...")
        return None, False, False

def ejecutar_menu_admin(db: BaseDatos) -> tuple:
    print("\n" + "="*50)
    print(" AGENCIA DE VIAJES AVENTURA - SISTEMA DE RESERVAS")
    print("="*50)
    print("Sesión activa: ADMINISTRADOR (Agencia)")
    print("1. Registrar Nuevo Destino")
    print("2. Armar y Publicar Nuevo Paquete Turístico")
    print("3. Ver Catálogo de Destinos")
    print("4. Cerrar Sesión Administrador")
    print("5. Salir")

    opcion = input("\nSeleccione una opción (1-5): ").strip()

    if opcion == "1":
        print("\n--- REGISTRAR NUEVO DESTINO TURÍSTICO ---")
        try:
            nombre = input("Nombre del destino: ").strip()
            zona = input("Zona / Ubicación: ").strip()
            descripcion = input("Descripción breve: ").strip()
            dias = leer_entero("Duración estimada (días): ", min_val=1)
            costo = leer_flotante("Costo base ($): ", min_val=1.0)
            nuevo_destino = Destino(0, nombre, zona, descripcion, dias, costo)
            id_dest = db.guardar_destino(nuevo_destino)
            print(f"\nDestino '{nombre}' guardado exitosamente con ID #{id_dest}.")
        except Exception:
            print("\nError al guardar el destino.")
        input("\nPresione solo Enter para continuar...")
        return True, False

    elif opcion == "2":
        print("\n--- ARMAR Y PUBLICAR PAQUETE TURÍSTICO ---")
        try:
            destinos_elegidos = seleccionar_destinos_por_ids(db)
            if not destinos_elegidos:
                input("\nPresione solo Enter para continuar...")
                return True, False

            nombre = input("Nombre comercial del paquete: ").strip()
            if len(nombre) < 3:
                print("El nombre del paquete debe tener al menos 3 caracteres.")
                input("\nPresione solo Enter para continuar...")
                return True, False

            cupo = leer_entero("Cupo máximo de personas: ", min_val=1)
            fecha_salida = date.today() + timedelta(days=20)
            fecha_regreso = fecha_salida + timedelta(days=7)

            paquete_tmp = Paquete(0, nombre, fecha_salida, fecha_regreso, cupo, destinos_elegidos)
            id_paq = db.guardar_paquete(paquete_tmp)

            print(f"\nPaquete '{nombre}' armado y publicado correctamente con ID #{id_paq}.")
            print(f"Precio publicado por persona: ${paquete_tmp.precio_publicado:,.0f}")
        except Exception:
            print("\nError al armar el paquete.")
        input("\nPresione solo Enter para continuar...")
        return True, False

    elif opcion == "3":
        mostrar_catalogo_visita(db)
        return True, False

    elif opcion == "4":
        print("\nSesión de Administrador cerrada correctamente.")
        input("\nPresione solo Enter para continuar...")
        return False, False

    elif opcion == "5":
        print("\nGracias por utilizar el sistema de Viajes Aventura.")
        return False, True

    else:
        print("\nOpción no válida.")
        input("\nPresione solo Enter para continuar...")
        return True, False


def menu_principal():
    db = BaseDatos()
    inicializar_datos_demo(db)
    cliente_actual = None
    es_admin = False

    while True:
        if es_admin:
            es_admin, salir = ejecutar_menu_admin(db)
            if salir:
                break
        elif cliente_actual:
            cliente_actual, salir = ejecutar_menu_cliente(db, cliente_actual)
            if salir:
                break
        else:
            cliente_actual, es_admin, salir = ejecutar_menu_visitante(db)
            if salir:
                break

if __name__ == "__main__":
    menu_principal()

           