const limpiarDatosUsuario = (userInstance) => {
    const data = userInstance.toJSON ? userInstance.toJSON() : { ...userInstance };
    delete data.password_hash;
    delete data.dvh;
    return data;
};

module.exports = { limpiarDatosUsuario };