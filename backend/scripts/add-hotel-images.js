import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Hotel image URLs - using Unsplash for placeholder images
const hotelImages = {
  'HT-2001': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
  'HT-2002': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
  'HT-2003': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
  'HT-2004': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
  'HT-2005': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  'HT-2006': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
  'HT-2007': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
  'HT-2008': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  'HT-2009': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
  'HT-2010': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
  'HT-2011': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  'HT-2012': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
  'HT-2013': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
  'HT-2014': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
  'HT-2015': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  'HT-2016': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
  'HT-2017': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
  'HT-2018': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  // Indian Hotels
  'HT-2019': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop', // Taj Mahal Palace
  'HT-2020': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop', // The Oberoi Mumbai
  'HT-2021': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop', // Marine Drive Hotel
  'HT-2022': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop', // ITC Gardenia
  'HT-2023': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop', // The Leela Palace
  'HT-2024': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop', // Koramangala Business Inn
  'HT-2025': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop', // Taj Exotica Resort
  'HT-2026': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop', // Baga Beach Resort
  'HT-2027': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop', // Candolim Beachfront Hotel
  'HT-2028': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop', // Rambagh Palace
  'HT-2029': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop', // Fairmont Jaipur
  'HT-2030': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop', // Pink City Heritage Hotel
  'HT-2031': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop', // Taj Falaknuma Palace
  'HT-2032': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop', // Novotel Hyderabad
  'HT-2033': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop', // Hitech City Business Hotel
  'HT-2034': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop', // ITC Grand Chola
  'HT-2035': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop', // The Leela Palace Chennai
  'HT-2036': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop', // Marina Beach Hotel
  'HT-2037': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop', // The Oberoi Grand
  'HT-2038': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop', // ITC Sonar
  'HT-2039': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop', // Park Street Heritage Hotel
  'HT-2040': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop', // The Oberoi Amarvilas
  'HT-2041': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop', // Taj View Hotel
  'HT-2042': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop', // Taj Lake Palace
  'HT-2043': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop', // The Leela Palace Udaipur
};

async function addHotelImages() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kayak';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('kayak');
    const collection = db.collection('hotels');
    
    let updated = 0;
    let notFound = 0;
    
    // Update each hotel with its image URL
    for (const [hotelId, imageUrl] of Object.entries(hotelImages)) {
      const result = await collection.updateOne(
        { id: hotelId },
        { $set: { imageUrl } }
      );
      
      if (result.matchedCount > 0) {
        updated++;
        console.log(`✅ Updated ${hotelId} with image URL`);
      } else {
        notFound++;
        console.log(`⚠️  Hotel ${hotelId} not found`);
      }
    }
    
    // For hotels without specific images, use a default image
    const hotelsWithoutImages = await collection.find({ 
      imageUrl: { $exists: false } 
    }).toArray();
    
    if (hotelsWithoutImages.length > 0) {
      const defaultImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop';
      const defaultResult = await collection.updateMany(
        { imageUrl: { $exists: false } },
        { $set: { imageUrl: defaultImage } }
      );
      console.log(`✅ Added default image to ${defaultResult.modifiedCount} hotels`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated} hotels`);
    console.log(`   Not found: ${notFound} hotels`);
    console.log(`   Default images added: ${hotelsWithoutImages.length} hotels`);
    
    // Show sample of updated hotels
    const sample = await collection.find({ imageUrl: { $exists: true } }).limit(5).toArray();
    console.log(`\n✅ Sample hotels with images:`);
    sample.forEach(hotel => {
      console.log(`   ${hotel.id} - ${hotel.name}: ${hotel.imageUrl ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

addHotelImages();

