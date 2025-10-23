// scripts/initCategories.js
import mongoose from 'mongoose';
import Category from '../models/categoryModel.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/seller-customer-platform';

const defaultCategories = [
  {
    name: 'Tools',
    description: 'Hand tools, power tools, and equipment for various tasks',
    specifications: {
      type: 'Tools',
      subcategories: 'Hand Tools, Power Tools, Measuring Tools, Safety Equipment'
    }
  },
  {
    name: 'Machineries',
    description: 'Heavy machinery, industrial equipment, and mechanical devices',
    specifications: {
      type: 'Machineries',
      subcategories: 'Heavy Machinery, Industrial Equipment, Mechanical Devices, Construction Equipment'
    }
  },
  {
    name: 'Fasteners',
    description: 'Screws, bolts, nuts, washers, and other fastening components',
    specifications: {
      type: 'Fasteners',
      subcategories: 'Screws, Bolts, Nuts, Washers, Rivets, Anchors'
    }
  },
  {
    name: 'Gloves',
    description: 'Protective gloves for various industries and applications',
    specifications: {
      type: 'Gloves',
      subcategories: 'Work Gloves, Safety Gloves, Chemical Resistant, Cut Resistant, Heat Resistant'
    }
  },
  {
    name: 'Others',
    description: 'Miscellaneous items and products that do not fit into other categories',
    specifications: {
      type: 'Others',
      subcategories: 'General Items, Miscellaneous Products, Custom Items'
    }
  }
];

async function initializeCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories (optional - remove this if you want to keep existing data)
    // await Category.deleteMany({});
    // console.log('Cleared existing categories');

    // Check if categories already exist
    const existingCategories = await Category.find({});
    if (existingCategories.length > 0) {
      console.log('Categories already exist. Skipping initialization.');
      console.log('Existing categories:', existingCategories.map(cat => cat.name));
      return;
    }

    // Insert default categories
    const insertedCategories = await Category.insertMany(defaultCategories);
    console.log(`Successfully initialized ${insertedCategories.length} categories:`);
    insertedCategories.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.description}`);
    });

  } catch (error) {
    console.error('Error initializing categories:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the initialization
initializeCategories();
