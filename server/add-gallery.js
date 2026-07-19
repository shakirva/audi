require("dotenv").config();
const sequelize = require("./db");
const { Tenant, Settings } = require("./models");

const SAMPLE_GALLERY = [
  {
    id: 1783609001,
    type: "image",
    src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1200",
    label: "Main Hall Wedding Setup",
    category: "Halls"
  },
  {
    id: 1783609002,
    type: "image",
    src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=1200",
    label: "Evening Reception Stage",
    category: "Events"
  },
  {
    id: 1783609003,
    type: "image",
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
    label: "Premium Wedding Decor",
    category: "Decor"
  },
  {
    id: 1783609004,
    type: "image",
    src: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=1200",
    label: "Conference Seating Setup",
    category: "Events"
  },
  {
    id: 1783609005,
    type: "image",
    src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1200",
    label: "Floral Entrance Arch",
    category: "Decor"
  },
  {
    id: 1783609006,
    type: "image",
    src: "https://images.unsplash.com/photo-1522413452208-996906271243?auto=format&fit=crop&q=80&w=1200",
    label: "Mini Hall Setup",
    category: "Halls"
  }
];

async function addGallery() {
  try {
    const tenant = await Tenant.findOne({ where: { slug: "sreelakshmi" } });
    if (!tenant) throw new Error("Tenant not found");

    const settingsRecords = await Settings.findAll({ where: { tenantId: tenant.id } });
    
    for (const setting of settingsRecords) {
      setting.gallery = SAMPLE_GALLERY;
      await setting.save();
    }
    
    console.log(`✅ Added ${SAMPLE_GALLERY.length} gallery images to Sreelakshmi tenant settings`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addGallery();
