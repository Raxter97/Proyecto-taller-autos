const limpiarDatosUsuario = (userInstance) => {
    const data = userInstance.toJSON ? userInstance.toJSON() : { ...userInstance };
    delete data.password_hash;
    delete data.dvh;
    return data;
};

const parsearBoolean = (valBoolean) => {
    if (typeof valBoolean === 'string') {
        return valBoolean.toLowerCase() === 'true';
    }
    return Boolean(valBoolean);
};

module.exports = { limpiarDatosUsuario, parsearBoolean };
