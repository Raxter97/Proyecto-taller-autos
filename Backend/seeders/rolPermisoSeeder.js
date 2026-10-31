const Rol = require('../models/Rol');
const Permiso = require('../models/Permiso');

const seedRolesYPermisos = async () => {
    try {
        // 1. Crear los 4 Roles del Sistema
        const [admin] = await Rol.findOrCreate({ 
            where: { nombre_rol: 'Administrativo' }, 
            defaults: { descripcion: 'Gestión financiera, parametrización de cuentas, personal, alta de proveedores y auditoría', estado: true, dvh: 'dummy' } 
        });
        const [recepcionista] = await Rol.findOrCreate({ 
            where: { nombre_rol: 'Recepcionista' }, 
            defaults: { descripcion: 'Alta/actualización de clientes, asociación vehicular, turnos y parking', estado: true, dvh: 'dummy' } 
        });
        const [mecanico] = await Rol.findOrCreate({ 
            where: { nombre_rol: 'Mecánico' }, 
            defaults: { descripcion: 'Diagnóstico, informes de reparación, repuestos consumidos e historial vehicular', estado: true, dvh: 'dummy' } 
        });
        const [encargado] = await Rol.findOrCreate({ 
            where: { nombre_rol: 'Encargado de deposito' }, 
            defaults: { descripcion: 'Logística de insumos, control de stock, catálogo, órdenes de compra y recepción', estado: true, dvh: 'dummy' } 
        });
        const [UsuarioRol] = await Rol.findOrCreate({ 
            where: { nombre_rol: 'Usuario' }, 
            defaults: { descripcion: 'Autogestión de perfil, turnos propios e historial de vehículos', estado: true, dvh: 'dummy' } 
        });

        const permisosData = [
            
            { nombre_permiso: 'SEGURIDAD_CRUD', modulo: 'Seguridad y Auditoría' },
            
            { nombre_permiso: 'CLIENTES_VEHICULOS_CRUD', modulo: 'Clientes y Vehículos' },
            { nombre_permiso: 'CLIENTES_VEHICULOS_LECTURA', modulo: 'Clientes y Vehículos' },
            
            { nombre_permiso: 'AGENDA_TURNOS_CRUD', modulo: 'Agenda y Turnos' },
            { nombre_permiso: 'AGENDA_TURNOS_LECTURA', modulo: 'Agenda y Turnos' },
            
            { nombre_permiso: 'PARKING_CRUD', modulo: 'Recepción y Parking' },
            { nombre_permiso: 'PARKING_LECTURA', modulo: 'Recepción y Parking' },
            
            { nombre_permiso: 'PERSONAL_EMPLEADOS_CRUD', modulo: 'Personal y Empleados' },
            
            { nombre_permiso: 'TALLER_REPARACIONES_CRUD', modulo: 'Taller y Reparaciones' },
            { nombre_permiso: 'TALLER_REPARACIONES_LECTURA', modulo: 'Taller y Reparaciones' },
            
            { nombre_permiso: 'INVENTARIO_COMPRAS_CRUD', modulo: 'Inventario y Compras' },
            { nombre_permiso: 'INVENTARIO_COMPRAS_LECTURA', modulo: 'Inventario y Compras' },
            
            { nombre_permiso: 'FACTURACION_COBRANZAS_CRUD', modulo: 'Facturación y Cobranzas' }
        ];

        const permisosCreados = [];
        for (const p of permisosData) {
            const [permiso] = await Permiso.findOrCreate({
                where: { nombre_permiso: p.nombre_permiso },
                defaults: { modulo: p.modulo, dvh: 'dummy' }
            });
            permisosCreados.push(permiso);
        }

        // 3. Asignar todos los permisos al rol Administrativo (Acceso C global)
        const todosLosPermisos = await Permiso.findAll();
        await admin.setPermisos(todosLosPermisos);

        // 4. Asignar permisos al Recepcionista (C en M2, M3, M4)
        const permisosRecepcion = permisosCreados.filter(p => 
            ['CLIENTES_VEHICULOS_CRUD', 'AGENDA_TURNOS_CRUD', 'PARKING_CRUD'].includes(p.nombre_permiso)
        );
        await recepcionista.setPermisos(permisosRecepcion);

        // 5. Asignar permisos al Mecánico (L en M2, M3, M4, C en M6, L en M7)
        const permisosMecanico = permisosCreados.filter(p => 
            ['CLIENTES_VEHICULOS_LECTURA', 'AGENDA_TURNOS_LECTURA', 'PARKING_LECTURA', 'TALLER_REPARACIONES_CRUD', 'INVENTARIO_COMPRAS_LECTURA'].includes(p.nombre_permiso)
        );
        await mecanico.setPermisos(permisosMecanico);

        // 6. Asignar permisos al Encargado de Depósito (L en M6, C en M7
        const permisosEncargado = permisosCreados.filter(p => 
            ['TALLER_REPARACIONES_LECTURA', 'INVENTARIO_COMPRAS_CRUD'].includes(p.nombre_permiso)
        );
        await encargado.setPermisos(permisosEncargado);

        const permisosCliente = permisosCreados.filter(p => 
            ['CLIENTES_VEHICULOS_LECTURA', 'AGENDA_TURNOS_LECTURA'].includes(p.nombre_permiso)
        );
        await UsuarioRol.setPermisos(permisosCliente);
        console.log('Seeder de Roles y Permisos sincronizado con la documentación oficial.');
    } catch (error) {
        console.error('Error al ejecutar el seeder:', error);
    }
};

module.exports = seedRolesYPermisos;