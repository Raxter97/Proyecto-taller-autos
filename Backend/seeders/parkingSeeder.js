const Parking = require('../models/Parking');

const seedParking = async () => {
    try {
        for (let i = 1; i <= 8; i++) {
            await Parking.findOrCreate({
                where: { nro_lugar: i },
                defaults: { estado: false, id_auto: null, dvh: 'dummy' }
            });
        }
        console.log('Seeder de Parking inicializado (Plazas 1 a 8).');
    } catch (error) {
        console.error('Error al inicializar el parking:', error);
    }
};

module.exports = seedParking;