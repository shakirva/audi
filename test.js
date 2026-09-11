const { Tenant, Environment, Booking } = require('./server/models');
async function test() {
  const tenant = await Tenant.findOne({ where: { slug: 'laurel-garden-eventt' } });
  if (!tenant) return console.log('no tenant');
  const env = await Environment.findOne({ where: { tenantId: tenant.id, type: 'production' } });
  const bookings = await Booking.findAll({
    where: { tenantId: tenant.id, environmentId: env.id },
    attributes: ['date', 'session', 'status']
  });
  console.log(bookings.map(b => b.toJSON()));
}
test();
