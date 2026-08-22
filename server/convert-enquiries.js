require('dotenv').config();
const db = require('./models');
const { Enquiry, Booking, Customer } = db;
const accountingEngine = require('./services/accountingEngine.service');

async function convertInterestedEnquiries() {
  const tenantId = 2; // ktconvention
  const environmentId = 2; // production

  try {
    const enquiries = await Enquiry.findAll({
      where: {
        tenantId,
        environmentId,
        status: 'Interested',
      },
      order: [['createdAt', 'ASC']]
    });

    console.log(`Found ${enquiries.length} 'Interested' enquiries to convert.`);

    let nextIdNumber = 30; // Start safely above existing

    for (const enq of enquiries) {
      console.log(`Converting Enquiry ${enq.enquiryNumber} for ${enq.enquirerName}...`);

      let customer = await Customer.findOne({
        where: { tenantId, environmentId, phone: enq.phone || '0000000000' }
      });
      
      if (!customer) {
        customer = await Customer.create({
          tenantId,
          environmentId,
          name: enq.enquirerName,
          phone: enq.phone || '0000000000',
        });
      }

      // Generate a clean booking ID manually to avoid the exponential bug
      const customBookingId = `KT_26-27-${String(nextIdNumber).padStart(3, '0')}`;
      nextIdNumber++;

      const booking = await Booking.create({
        tenantId,
        environmentId,
        customerId: customer.id,
        enquiryId: enq.id,
        bookingId: customBookingId,
        customerName: enq.enquirerName,
        phone: enq.phone || '0000000000',
        eventType: enq.eventType,
        hall: enq.hall || 'Main Hall',
        date: enq.tentativeDate || new Date().toISOString().split('T')[0],
        session: enq.session || 'Full Day',
        guests: enq.guests || 0,
        advance: 0,
        totalAmount: 0,
        status: 'Confirmed', 
        notes: `Converted from enquiry ${enq.enquiryNumber}`,
        createdBy: 20 // Manu
      });

      await enq.update({ status: 'Booking Confirmed' });

      try {
        await accountingEngine.onBookingCreated(booking, {
          tenantId,
          environmentId,
          createdBy: 20
        });
      } catch (err) {
        console.error(`Accounting error for ${booking.bookingId}:`, err.message);
      }

      console.log(`Successfully converted to Booking ${booking.bookingId}`);
    }

    console.log('Conversion complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

convertInterestedEnquiries();
