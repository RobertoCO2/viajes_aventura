
import sys
from datetime import date, timedelta
from modelos import Cliente, Destino, Paquete, Reserva
from base_datos import BaseDatos


def inicializar_datos_demo(db: BaseDatos):
   
    destinos = db.obtener_todos_los_destinos()
    if not destinos:
        print(" Cargando catálogo inicial de destinos turísticos...")
        db.guardar_destino(Destino(0, "Cajón del Maipo", "Región Metropolitana", "Trekking y termas", 1, 45000.0))
        db.guardar_destino(Destino(0, "Salar de Surire", "Región de Arica y Parinacota", "Altiplano y fauna", 3, 310000.0))
        db.guardar_destino(Destino(0, "Valle del Elqui", "Región de Coquimbo", "Observación astronómica", 2, 120000.0))
        db.guardar_destino(Destino(0, "Parque Conguillío", "Región de La Araucanía", "Bosque de araucarias", 3, 185000.0))
        print(" Destinos iniciales agregados exitosamente.")


def menu_principal():
    db = BaseDatos()
    inicializar_datos_demo(db)
    cliente_actual = None

    while True:
        print("\n" + "="*50)
        print("   AGENCIA DE VIAJES AVENTURA - SISTEMA DE RESERVAS ")
        print("="*50)

        if cliente_actual:
            print(f" Sesión activa: {cliente_actual.nombre_completo} | RUT: {cliente_actual.obtener_rut_enmascarado()}")
            print("1. Ver Catálogo de Destinos")
            print("2. Crear Paquete y Simular Reserva")
            print("3. Cerrar Sesión")
            print("4. Salir")
        else:
            print("1. Registrarse como Cliente")
            print("2. Iniciar Sesión")
            print("3. Ver Catálogo de Destinos (Visitas)")
            print("4. Salir")

        opcion = input("\nSeleccione una opción (1-4): ").strip()

        if not cliente_actual:
            if opcion == "1":
                print("\n--- REGISTRO DE CLIENTE ---")
                try:
                    nombre = input("Nombre completo: ").strip()
                    email = input("Correo electrónico: ").strip()
                    rut = input("RUT (ej: 19223445-K): ").strip()
                    telefono = input("Teléfono (+569...): ").strip()
                    clave = input("Contraseña (mínimo 6 caracteres): ").strip()

                    cliente_nuevo = Cliente(0, nombre, email, rut, telefono, clave_raw=clave)
                    id_ingresado = db.registrar_cliente(cliente_nuevo)
                    print(f" ¡Cliente registrado exitosamente con ID #{id_ingresado}!")
                    
                except Exception as e:
                    print(f" Error al registrar cliente: {e}")
                   
            elif opcion == "2":
                print("\n--- INICIO DE SESIÓN ---")
                email = input("Correo electrónico: ").strip()
                clave = input("Contraseña: ").strip()

                datos_cliente = db.obtener_cliente_por_email(email)
                if datos_cliente:
                    cliente_tmp = Cliente(
                        datos_cliente["id_usuario"],
                        datos_cliente["nombre_completo"],
                        datos_cliente["email"],
                        datos_cliente["rut"],
                        datos_cliente["telefono"],
                        clave_hash=datos_cliente["clave_hash"]
                    )

                    if cliente_tmp.autenticar(clave):
                        cliente_actual = cliente_tmp
                        print(f" ¡Bienvenido de nuevo, {cliente_actual.nombre_completo}!")
                    else:
                        print(" Contraseña incorrecta.")
                else:
                    print(" No existe una cuenta registrada con ese correo.")

            elif opcion == "3":
                print("\n--- CATÁLOGO DE DESTINOS ---")
                destinos = db.obtener_todos_los_destinos()
                for d in destinos:
                    estado_str = "Disponible" if d.disponible else "No disponible"
                    print(f" ID #{d.id_destino}: {d.nombre} ({d.zona}) | Duración: {d.duracion_dias} días | Costo Base: ${d.costo_base:,.0f} | Estado: {estado_str}")
                    input("\n Presione Enter para continuar...")

            elif opcion == "4":
                print("\n ¡Gracias por usar el sistema de Viajes Aventura!")
                sys.exit(0)

        else:
            if opcion == "1":
                print("\n--- CATÁLOGO DE DESTINOS ---")
                destinos = db.obtener_todos_los_destinos()
                for d in destinos:
                    estado_str = "Disponible" if d.disponible else "No disponible"
                    print(f" ID #{d.id_destino}: {d.nombre} ({d.zona}) | Duración: {d.duracion_dias} días | Costo Base: ${d.costo_base:,.0f} | Estado: {estado_str}")
                input("\n Presione Enter para continuar...")

            elif opcion == "2":
                print("\n--- CREAR PAQUETE Y EMITIR RESERVA ---")
                try:
                    destinos_disponibles = [d for d in db.obtener_todos_los_destinos() if d.disponible]
                    if len(destinos_disponibles) < 2:
                        print(" Se requieren al menos 2 destinos disponibles para crear un paquete.")
                        continue
        
                    nombre_paquete = input("Nombre para tu Paquete Turístico: ").strip()
                    cupo_max = int(input("Cupo máximo de personas para el paquete: "))
        
                    fecha_salida = date.today() + timedelta(days=15)
                    fecha_regreso = fecha_salida + timedelta(days=5)
        
                    # Combinar los dos primeros destinos (Regla R3: 2 a 5 destinos)
                    destinos_elegidos = [destinos_disponibles[0], destinos_disponibles[1]]
                    paquete = Paquete(0, nombre_paquete, fecha_salida, fecha_regreso, cupo_max, destinos_elegidos)
                    id_paq = db.guardar_paquete(paquete)
        
                    print(f" Paquete '{paquete.nombre}' guardado con ID #{id_paq}.")
                    print(f" Precio publicado por persona (Costo Base + 20% margen): ${paquete.precio_publicado:,.0f}")
        
                    cant_personas = int(input("¿Para cuántas personas deseas reservar?: "))
        
                    reserva = Reserva(0, cliente_actual, paquete, cant_personas)
                    id_res = db.guardar_reserva(reserva)
        
                    print("\n ¡RESERVA EMITIDA Y CONGELADA EXITOSAMENTE! ")
                    print(reserva.obtener_detalle_reserva())
        
                except Exception as e:
                    print(f" Error al procesar reserva: {e}")
                    input("\nPresione Enter para continuar...")
                                            
            elif opcion == "3":
                cliente_actual = None
                print(" Sesión cerrada correctamente.")
                input("\n Presione Enter para continuar...")

            elif opcion == "4":
                print("\n ¡Gracias por usar el sistema de Viajes Aventura!")
                sys.exit(0)
            
if __name__ == "__main__":
    menu_principal()



            
            
       