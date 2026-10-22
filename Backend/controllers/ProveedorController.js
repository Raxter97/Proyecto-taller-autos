// const { registrarBitacora } = require('../services/BitacoraService');

        
//         await registrarBitacora({
//             accion: 'LOGIN_EXITOSO',
//             descripcion: `El usuario ${user.email} inició sesión correctamente.`,
//             nivel_impacto: 'Baja',
//             id_usuario: user.id_user
//         });

// await registrarBitacora({
//     accion: 'UPDATE_CLIENTE',
//     descripcion: JSON.stringify({ estado_previo: clienteActual, estado_posterior: clienteModificado }),
//     nivel_impacto: 'Media',
//     id_usuario: req.user.id_user
// });

// await registrarBitacora({
//     accion: 'SOFT_DELETE_CLIENTE',
//     descripcion: JSON.stringify({ estado_previo: { estado: true }, estado_posterior: { estado: false } }),
//     nivel_impacto: 'Alta',
//     id_usuario: req.user.id_user
// });