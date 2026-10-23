const User = require('../models/User.models');
const Rol = require('../models/Rol');
const Permiso = require('../models/Permiso');

const verificarPermiso = (nombrePermisoRequerido) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id_user;
            if (!userId) {
                return res.status(401).json({ mensaje: 'No autorizado.' });
            }

            // Buscar usuario e incluir sus roles y los permisos de dichos roles
            const user = await User.findByPk(userId, {
                include: {
                    model: Rol,
                    as: 'roles', 
                    include: {
                        model: Permiso,
                        as: 'permisos'
                    }
                }
            });

            if (!user || !user.roles) {
                return res.status(403).json({ mensaje: 'Acceso denegado: sin roles asignados.' });
            }

            const permisosUsuario = user.roles.flatMap(rol => 
                rol.permisos ? rol.permisos.map(p => p.nombre_permiso) : []
            );

            // Verifica si el usuario posee el permiso requerido
            if (!permisosUsuario.includes(nombrePermisoRequerido)) {
                return res.status(403).json({ 
                    mensaje: `Acceso prohibido. Se requiere el permiso: ${nombrePermisoRequerido}` 
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({ mensaje: 'Error al verificar permisos', error: error.message });
        }
    };
};

module.exports = { verificarPermiso };