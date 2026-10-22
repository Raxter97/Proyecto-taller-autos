const crypto = require('crypto');

const calcularDVH = (dataObject) => {
  const stringData = Object.keys(dataObject).sort()
    .filter(key => key !== 'dvh')
    .map(key => `${key}:${String(dataObject[key])}`)
    .join('|');
  return crypto.createHash('sha256').update(stringData).digest('hex');
};

const calcularDVV = (listaDVH) => {
  const stringDVHs = listaDVH.join('');
  return crypto.createHash('sha256').update(stringDVHs).digest('hex');
};

module.exports = { calcularDVH, calcularDVV };