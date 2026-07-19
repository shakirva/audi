require("dotenv").config();
const sequelize = require("./db");
const { Tenant, Settings } = require("./models");

const MORE_IMAGES = [
  {
    id: 1783609007,
    type: "image",
    src: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200",
    label: "Dining & Buffet Area",
    category: "Halls"
  },
  {
    id: 1783609008,
    type: "image",
    src: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=1200",
    label: "Venue Exterior at Night",
    category: "Halls"
  },
  {
    id: 1783609009,
    type: "image",
    src: "https://images.unsplash.com/photo-1549488344-c18ea7c558dc?auto=format&fit=crop&q=80&w=1200",
    label: "Luxury Chandelier Details",
    category: "Decor"
  },
  {
    id: 1783609010,
    type: "image",
    src: "https://images.unsplash.com/photo-1561501878-aabd62634533?auto=format&fit=crop&q=80&w=1200",
    label: "Banquet Seating Arrangement",
    category: "Events"
  },
  {
    id: 1783609011,
    type: "image",
    src: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&q=80&w=1200",
    label: "Bridal Stage Lighting",
    category: "Decor"
  },
  {
    id: 1783609012,
    type: "image",
    src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200",
    label: "VIP Lounge Area",
    category: "Halls"
  }
];

async function addMoreGallery() {
  try {
    const tenant = await Tenant.findOne({ where: { slug: "sreelakshmi" } });
    if (!tenant) throw new Error("Tenant not found");

    const settingsRecords = await Settings.findAll({ where: { tenantId: tenant.id } });
    
    for (const setting of settingsRecords) {
      const existingGallery = setting.gallery || [];
      setting.gallery = [...existingGallery, ...MORE_IMAGES];
      await setting.save();
    }
    
    console.log(`✅ Appended ${MORE_IMAGES.length} more images to Sreelakshmi tenant settings`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addMoreGallery();
