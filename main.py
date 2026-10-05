
import sys
import time
from datetime import date, datetime, timedelta
from modelos import Cliente, Administrador, Destino, Paquete, Reserva, ServicioMoneda
from base_datos import BaseDatos

try:
    import msvcrt
    HAS_MSVCRT = True
except ImportError:
    HAS_MSVCRT = False
    import getpass


def leer_clave_enmascarada(prompt: str = "Contraseña: ") -> str:
    """
    Lee la clave caracter por caracter:
    - Muestra la letra por 0.3s
    - Luego la reemplaza por '#'
    - Compatible con Windows (msvcrt) y otros sistemas (getpass)
    """
    if not HAS_MSVCRT:
        # En Linux/Mac se usa getpass (no muestra nada)
        return getpass.getpass(prompt)

    sys.stdout.write(prompt)
    sys.stdout.flush()
    clave = ""
    while True:
        ch = msvcrt.getch()

        # Enter
        if ch in (b'\r', b'\n'):
            sys.stdout.write("\n")
            sys.stdout.flush()
            break

        # Backspace
        elif ch == b'\b':
            if len(clave) > 0:
                clave = clave[:-1]
                sys.stdout.write("\b \b")
                sys.stdout.flush()

        # Caracter imprimible
        elif ch >= b' ':
            try:
                char = ch.decode('utf-8')
            except UnicodeDecodeError:
                continue
            clave += char
            sys.stdout.write(char)
            sys.stdout.flush()
            time.sleep(0.3)
            sys.stdout.write("\b#")
            sys.stdout.flush()

    return clave

def login_cliente():
    correo = input("Correo: ")
    clave = leer_clave_enmascarada("Clave: ")
    # Validación contra la base de datos
    cliente = BaseDatos.buscar_cliente(correo, clave)
    if cliente:
        print("Ingreso exitoso como Cliente")
        return cliente
    else:
        print("Correo o clave incorrectos")
        return None


def login_administrador():
    correo = input("Correo: ")
    clave = leer_clave_enmascarada("Clave: ")
    # Validación contra la base de datos
    admin = BaseDatos.buscar_administrador(correo, clave)
    if admin:
        print("Bienvenido Administrador")
        return admin
    else:
        print("Credenciales inválidas")
        return None

def inicializar_datos_demo(db: BaseDatos):
    destinos = db.obtener_todos_los_destinos()
    if not destinos:
        db.guardar_destino(Destino(0, "Cajon del Maipo", "Region Metropolitana", "Trekking y termas", 1, 45000.0))
        db.guardar_destino(Destino(0, "Salar de Surire", "Region de Arica y Parinacota", "Reserva nacional y flamencos", 3, 310000.0))
        db.guardar_destino(Destino(0, "Valle del Elqui", "Region de Coquimbo", "Observacion astronomica y pisco", 2, 120000.0))
        db.guardar_destino(Destino(0, "Parque Conguillio", "Region de La Araucania", "Araucarias y volcan Llaima", 3, 185000.0))

    paquetes = db.obtener_todos_los_paquetes()
    if not paquetes:
        dest_actuales = db.obtener_todos_los_destinos()
        if len(dest_actuales) >= 2:
            p1 = Paquete(0, "Escapada Centro-Norte", date.today() + timedelta(days=20), date.today() + timedelta(days=25), 10, dest_actuales[:2])
            db.guardar_paquete(p1)


def leer_entero(mensaje: str, min_val: int = None) -> int:
    while True:
        try:
            val = int(input(mensaje).strip())
            if min_val is not None and val < min_val:
                print(f"El valor debe ser al menos {min_val}.")
                continue
            return val
        except ValueError:
            print("Por favor, ingrese un numero entero valido.")


def mostrar_catalogo_con_api(db: BaseDatos):
    print("\n--- CATALOGO DE DESTINOS Y PAQUETES ---")
    
    valor_dolar = ServicioMoneda.obtener_valor_dolar()
    if valor_dolar:
        print(f"[Tipo de Cambio Hoy] 1 USD = ${valor_dolar:,.2f} CLP\n")
    else:
        print("[Aviso] No se pudo obtener el tipo de cambio en vivo. Mostrando valores en CLP.\n")

    print("--- DESTINOS DISPONIBLES ---")
    destinos = db.obtener_todos_los_destinos()
    for d in destinos:
        estado_str = "Disponible" if d.disponible else "No disponible"
        if valor_dolar:
            costo_usd = d.costo_base / valor_dolar
            print(f"ID #{d.id_destino}: {d.nombre} ({d.zona}) | ${d.costo_base:,.0f} CLP (USD ${costo_usd:,.2f}) | {estado_str}")
        else:
            print(f"ID #{d.id_destino}: {d.nombre} ({d.zona}) | ${d.costo_base:,.0f} CLP | {estado_str}")

    print("\n--- PAQUETES PUBLICADOS ---")
    paquetes = db.obtener_todos_los_paquetes()
    if not paquetes:
        print("No hay paquetes publicados actualmente.")
    else:
        for p in paquetes:
            if valor_dolar:
                precio_usd = p["precio_publicado"] / valor_dolar
                print(f"ID #{p['id_paquete']}: {p['nombre']} | Salida: {p['fecha_salida']} | Precio/persona: ${p['precio_publicado']:,.0f} CLP (USD ${precio_usd:,.2f}) | Cupo: {p['cupo_maximo']}")
            else:
                print(f"ID #{p['id_paquete']}: {p['nombre']} | Salida: {p['fecha_salida']} | Precio/persona: ${p['precio_publicado']:,.0f} CLP | Cupo: {p['cupo_maximo']}")

    input("\nPresione solo Enter para continuar...")


def ejecutar_menu_cliente(db: BaseDatos, cliente_actual: Cliente) -> tuple:
    print("\n" + "="*50)
    print("   AGENCIA DE VIAJES AVENTURA - PORTAL CLIENTE")
    print("="*50)
    print(f"Sesion activa: {cliente_actual.nombre_completo} [RUT: {cliente_actual.obtener_rut_enmascarado()}]")
    print("1. Ver Catalogo de Destinos y Paquetes (Precios CLP/USD)")
    print("2. Reservar Paquete Turistico")
    print("3. Ver Historial de Mis Reservas")
    print("4. Cerrar Sesion")
    print("5. Salir")

    opcion = input("\nSeleccione una opcion (1-5): ").strip()

    if opcion == "1":
        mostrar_catalogo_con_api(db)
        return cliente_actual, False

    elif opcion == "2":
        try:
            paquetes = db.obtener_todos_los_paquetes()
            if not paquetes:
                print("\nNo existen paquetes disponibles para reservar en este momento.")
                input("\nPresione solo Enter para continuar...")
                return cliente_actual, False

            print("\nPaquetes disponibles para reservar:")
            for p in paquetes:
                print(f"ID #{p['id_paquete']}: {p['nombre']} | Salida: {p['fecha_salida']} | Precio: ${p['precio_publicado']:,.0f} CLP")

            id_paq = leer_entero("\nIngrese el ID del paquete que desea reservar: ", min_val=1)
            paq_dict = next((p for p in paquetes if p["id_paquete"] == id_paq), None)

            if not paq_dict:
                print("\nID de paquete invalido.")
                input("\nPresione solo Enter para continuar...")
                return cliente_actual, False

            fecha_salida_dt = datetime.strptime(paq_dict["fecha_salida"], "%Y-%m-%d").date()
            cant_personas = leer_entero("¿Para cuantas personas desea reservar?: ", min_val=1)

            cupo_ocupado = db.obtener_cupo_reservado_paquete(id_paq)
            cupo_disponible = paq_dict["cupo_maximo"] - cupo_ocupado

            if cant_personas > cupo_disponible:
                print(f"\nReserva rechazada: La cantidad solicitada ({cant_personas}) supera el cupo disponible ({cupo_disponible}).")
                input("\nPresione solo Enter para continuar...")
                return cliente_actual, False

            destinos_dummy = [Destino(1, "Destino A", "Zona A", "Desc", 1, 1000.0), Destino(2, "Destino B", "Zona B", "Desc", 1, 1000.0)]
            paquete_obj = Paquete(paq_dict["id_paquete"], paq_dict["nombre"], fecha_salida_dt, fecha_salida_dt + timedelta(days=5), paq_dict["cupo_maximo"], destinos_dummy, precio_publicado=paq_dict["precio_publicado"])

            reserva = Reserva(0, cliente_actual, paquete_obj, cant_personas)
            id_reserva = db.guardar_reserva(reserva)

            print("\n" + "="*50)
            print("   RESERVA EMITIDA Y CONFIRMADA EXITOSAMENTE")
            print("="*50)
            print(f"Reserva N°           : #{id_reserva}")
            print(f"Cliente              : {cliente_actual.nombre_completo} [RUT: {cliente_actual.obtener_rut_enmascarado()}]")
            print(f"Paquete              : {paq_dict['nombre']}")
            print(f"Cantidad Pasajeros   : {cant_personas} persona(s)")
            print(f"Precio por Persona   : ${paq_dict['precio_publicado']:,.0f} CLP")
            print("-" * 50)
            print(f"MONTO TOTAL A PAGAR  : ${reserva.total_cobrado:,.0f} CLP")
            print("="*50)

        except Exception as e:
            print(f"\nOcurrio un inconveniente al procesar la reserva: {e}")

        input("\nPresione solo Enter para continuar...")
        return cliente_actual, False

    elif opcion == "3":
        print("\n--- HISTORIAL DE MIS RESERVAS ---")
        reservas = db.obtener_reservas_por_cliente(cliente_actual.id_usuario)
        if not reservas:
            print("Usted no registra reservas actualmente en el sistema.")
        else:
            for r in reservas:
                print(f"Reserva N°{r['id_reserva']} | Paquete: {r['paquete_nombre']} | Personas: {r['cantidad_personas']} | Total: ${r['monto_total_congelado']:,.0f} CLP | Fecha: {r['fecha_salida']} | Estado: {r['estado']}")
        input("\nPresione solo Enter para continuar...")
        return cliente_actual, False

    elif opcion == "4":
        print("\nSesion cerrada correctamente.")
        input("\nPresione solo Enter para continuar...")
        return None, False

    elif opcion == "5":
        print("\nGracias por utilizar el sistema de Viajes Aventura.")
        return None, True

    else:
        print("\nOpcion no valida.")
        input("\nPresione solo Enter para continuar...")
        return cliente_actual, False


def ejecutar_menu_admin(db: BaseDatos, admin_actual: Administrador) -> tuple:
    print("\n" + "="*50)
    print("   AGENCIA DE VIAJES AVENTURA - PANEL ADMINISTRADOR")
    print("="*50)
    print(f"Sesion activa: {admin_actual.nombre_completo}")
    print("1. Gestionar Destinos (Agregar / Editar / Cambiar Estado)")
    print("2. Gestionar Paquetes (Crear / Listar / Eliminar)")
    print("3. Gestionar Reservas (Listar Todas / Cambiar Estado / Eliminar)")
    print("4. Cerrar Sesion")
    print("5. Salir")

    opcion = input("\nSeleccione una opcion (1-5): ").strip()

    if opcion == "1":
        print("\n--- GESTION DE DESTINOS ---")
        print("1. Agregar Nuevo Destino")
        print("2. Modificar / Cambiar Disponibilidad de Destino")
        sub_op = input("Seleccione (1-2): ").strip()

        if sub_op == "1":
            nombre = input("Nombre del destino: ").strip()
            zona = input("Zona geografica: ").strip()
            desc = input("Descripcion: ").strip()
            dias = leer_entero("Duracion en dias: ", min_val=1)
            costo = float(input("Costo base en CLP: ").strip())
            dest = Destino(0, nombre, zona, desc, dias, costo)
            db.guardar_destino(dest)
            print("\nDestino registrado exitosamente en el catalogo.")

        elif sub_op == "2":
            destinos = db.obtener_todos_los_destinos()
            for d in destinos:
                print(f"ID #{d.id_destino}: {d.nombre} | Costo: ${d.costo_base:,.0f} | Disponible: {d.disponible}")
            id_d = leer_entero("\nID del destino a modificar: ", min_val=1)
            d_obj = db.obtener_destino_por_id(id_d)
            if d_obj:
                nuevo_nom = input(f"Nuevo nombre [{d_obj.nombre}]: ").strip() or d_obj.nombre
                nuevo_costo = input(f"Nuevo costo [{d_obj.costo_base}]: ").strip()
                costo_val = float(nuevo_costo) if nuevo_costo else d_obj.costo_base
                disp_str = input("¿Disponible? (s/n): ").strip().lower()
                disp_val = True if disp_str == 's' else False
                db.actualizar_destino(id_d, nuevo_nom, costo_val, disp_val)
                print("\nDestino actualizado correctamente.")
        input("\nPresione solo Enter para continuar...")
        return admin_actual, False

    elif opcion == "2":
        print("\n--- GESTION DE PAQUETES ---")
        print("1. Listar Paquetes")
        print("2. Crear Paquete Combinando Destinos")
        print("3. Eliminar Paquete")
        sub_op = input("Seleccione (1-3): ").strip()

        if sub_op == "1":
            paquetes = db.obtener_todos_los_paquetes()
            for p in paquetes:
                print(f"ID #{p['id_paquete']}: {p['nombre']} | Salida: {p['fecha_salida']} | Precio: ${p['precio_publicado']:,.0f} CLP | Cupo: {p['cupo_maximo']}")

        elif sub_op == "2":
            destinos = db.obtener_todos_los_destinos()
            print("\nDestinos activos disponibles:")
            for d in destinos:
                if d.disponible:
                    print(f"ID #{d.id_destino}: {d.nombre} (${d.costo_base:,.0f})")
            ids_input = input("\nIngrese los ID de destinos separados por comas (ej: 1, 2): ").strip()
            ids = [int(i.strip()) for i in ids_input.split(",") if i.strip().isdigit()]
            d_elegidos = [db.obtener_destino_por_id(i) for i in ids if db.obtener_destino_por_id(i)]

            if len(d_elegidos) >= 2:
                nom_paq = input("Nombre comercial del paquete: ").strip() or "Paquete Especial"
                cupo = leer_entero("Cupo maximo de pasajeros: ", min_val=1)
                paq = Paquete(0, nom_paq, date.today() + timedelta(days=30), date.today() + timedelta(days=35), cupo, d_elegidos)
                db.guardar_paquete(paq)
                print(f"\nPaquete '{nom_paq}' creado exitosamente con precio publicado de ${paq.precio_publicado:,.0f} CLP.")
            else:
                print("\nDebe seleccionar al menos 2 destinos validos.")

        elif sub_op == "3":
            id_p = leer_entero("ID del paquete a eliminar: ", min_val=1)
            if db.eliminar_paquete(id_p):
                print("\nPaquete eliminado exitosamente.")
            else:
                print("\nNo se encontro el paquete especificado.")
        input("\nPresione solo Enter para continuar...")
        return admin_actual, False

    elif opcion == "3":
        print("\n--- GESTION GLOBAL DE RESERVAS ---")
        print("1. Listar Todas las Reservas de la Agencia")
        print("2. Actualizar Estado de una Reserva")
        print("3. Eliminar / Cancelar Reserva")
        sub_op = input("Seleccione (1-3): ").strip()

        if sub_op == "1":
            reservas = db.obtener_todas_las_reservas()
            if not reservas:
                print("No hay reservas registradas en el sistema.")
            else:
                for r in reservas:
                    print(f"Reserva N°{r['id_reserva']} | Cliente: {r['cliente_nombre']} | Paquete: {r['paquete_nombre']} | Personas: {r['cantidad_personas']} | Total: ${r['monto_total_congelado']:,.0f} CLP | Estado: {r['estado']}")

        elif sub_op == "2":
            id_r = leer_entero("ID de la reserva a actualizar: ", min_val=1)
            nuevo_est = input("Ingrese el nuevo estado (ej: Pagada / Confirmada / Cancelada): ").strip()
            if db.actualizar_estado_reserva(id_r, nuevo_est):
                print("\nEstado de la reserva actualizado exitosamente.")
            else:
                print("\nReserva no encontrada.")

        elif sub_op == "3":
            id_r = leer_entero("ID de la reserva a eliminar: ", min_val=1)
            if db.eliminar_reserva(id_r):
                print("\nReserva eliminada exitosamente del sistema.")
            else:
                print("\nReserva no encontrada.")
        input("\nPresione solo Enter para continuar...")
        return admin_actual, False

    elif opcion == "4":
        print("\nSesion de administrador cerrada correctamente.")
        input("\nPresione solo Enter para continuar...")
        return None, False

    elif opcion == "5":
        print("\nGracias por utilizar el sistema de Viajes Aventura.")
        return None, True

    else:
        print("\nOpcion no valida.")
        input("\nPresione solo Enter para continuar...")
        return admin_actual, False


def menu_principal():
    db = BaseDatos()
    inicializar_datos_demo(db)
    usuario_actual = None

    while True:
        if usuario_actual:
            if usuario_actual.rol == "admin":
                usuario_actual, salir = ejecutar_menu_admin(db, usuario_actual)
            else:
                usuario_actual, salir = ejecutar_menu_cliente(db, usuario_actual)
            if salir:
                sys.exit(0)
        else:
            print("\n" + "="*50)
            print("   AGENCIA DE VIAJES AVENTURA - SISTEMA PRINCIPAL")
            print("="*50)
            print("1. Explorar Catalogo")
            print("2. Iniciar Sesion como CLIENTE")
            print("3. Registrarse como CLIENTE")
            print("4. Acceso ADMINISTRADOR")
            print("5. Salir")

            opcion = input("\nSeleccione una opcion (1-5): ").strip()

            if opcion == "1":
                mostrar_catalogo_con_api(db)

            elif opcion == "2":
                print("\n--- INICIO DE SESION CLIENTE ---")
                email = input("Correo electronico: ").strip()
                clave = leer_clave_enmascarada("Contrasena: ").strip()

                datos_usr = db.obtener_usuario_por_email(email)
                if datos_usr:
                    if datos_usr["rol"] != "cliente":
                        print("\nEsta opcion es exclusiva para clientes. Si es Administrador, utilice la opcion 4 del menu.")
                    else:
                        usr_tmp = Cliente(datos_usr["id_usuario"], datos_usr["nombre"], datos_usr["email"], datos_usr["rut"], datos_usr["telefono"], clave_hash=datos_usr["clave_hash"])
                        if usr_tmp.autenticar(clave):
                            usuario_actual = usr_tmp
                            print(f"\nBienvenido de nuevo, {usuario_actual.nombre_completo}.")
                        else:
                            print("\nContrasena incorrecta.")
                else:
                    print("\nNo existe una cuenta de cliente registrada con ese correo.")
                input("\nPresione solo Enter para continuar...")

            elif opcion == "3":
                print("\n--- REGISTRO DE CLIENTE ---")
                try:
                    nombre = input("Nombre completo: ").strip()
                    email = input("Correo electronico: ").strip()
                    rut = input("RUT (ej: 11111111-1): ").strip()
                    telefono = input("Telefono: ").strip()
                    clave = leer_clave_enmascarada("Contrasena (minimo 6 caracteres): ").strip()

                    cliente_nuevo = Cliente(0, nombre, email, rut, telefono, clave_raw=clave)
                    db.registrar_cliente(cliente_nuevo)
                    print("\nCliente registrado exitosamente. Ahora puede iniciar sesion.")
                except Exception as e:
                    print(f"\nError al registrar cliente: {e}")
                input("\nPresione solo Enter para continuar...")

            elif opcion == "4":
                print("\n--- ACCESO ADMINISTRADOR ---")
                email = input("Correo de Administrador: ").strip()
                clave = leer_clave_enmascarada("Contrasena de Administrador: ").strip()

                datos_usr = db.obtener_usuario_por_email(email)
                if datos_usr:
                    if datos_usr["rol"] != "admin":
                        print("\nAcceso denegado. Este correo no cuenta con privilegios de Administrador.")
                    else:
                        usr_tmp = Administrador(datos_usr["id_usuario"], datos_usr["nombre"], datos_usr["email"], clave_hash=datos_usr["clave_hash"])
                        if usr_tmp.autenticar(clave):
                            usuario_actual = usr_tmp
                            print(f"\nBienvenido al Panel Administrador, {usuario_actual.nombre_completo}.")
                        else:
                            print("\nContrasena incorrecta.")
                else:
                    print("\nNo existe una cuenta de administrador con ese correo.")
                input("\nPresione solo Enter para continuar...")

            elif opcion == "5":
                print("\nGracias por utilizar el sistema de Viajes Aventura.")
                sys.exit(0)


if __name__ == "__main__":
    menu_principal()
