const { createEnquirySchema } = require("./server/validators/enquiry.validator");
const result = createEnquirySchema.safeParse({
  body: {
    enquirerName: "shana",
    enquirerPhone: "08086645733",
    eventType: "Wedding"
  }
});
console.log(result.error || "Success");
