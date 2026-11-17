const { sequelize, Vehicle } = require('../models');

// One atomic UPDATE avoids losing a higher reading when two expenses arrive together.
async function advanceOdometer(vehicleId, userId, km, transaction) {
  if (km == null || !Number.isFinite(km) || km < 0) return;
  await Vehicle.update({
    currentOdometer: sequelize.literal(`CASE WHEN "currentOdometer" IS NULL OR "currentOdometer" < ${km} THEN ${km} ELSE "currentOdometer" END`),
  }, { where: { _id: vehicleId, userId }, transaction });
}

module.exports = { advanceOdometer };
