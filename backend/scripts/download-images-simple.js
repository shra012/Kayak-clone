#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: storageBucket,
});

const bucket = getStorage().bucket();

/**
 * Download image from URL and upload to Firebase Storage
 */
async function downloadAndUpload(imageUrl, storagePath, contentType = 'image/jpeg') {
  try {
    console.log(`Downloading: ${imageUrl}`);
    
    // Download image
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const buffer = Buffer.from(response.data);
    const file = bucket.file(storagePath);
    
    // Upload to Firebase
    await file.save(buffer, {
      metadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make file publicly accessible
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${storageBucket}/${storagePath}`;
    console.log(`Uploaded: ${storagePath}`);
    console.log(`   URL: ${publicUrl}\n`);
    
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error(`Error processing ${storagePath}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get content type from filename
 */
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
  };
  return types[ext] || 'image/jpeg';
}

/**
 * Main function
 */
async function main() {
  // Image URLs - Replace these with actual image URLs from DuckDuckGo/Unsplash/Pexels
  // You can search on these sites and copy image URLs, or use their APIs
  
  const images = {
    flights: [
      {
        name: 'flight1.jpg',
        url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', // Airplane in sky
        storagePath: 'kayak/backgrounds/flights/flight1.jpg',
      },
      {
        name: 'flight2.jpg',
        url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80', // Aircraft
        storagePath: 'kayak/backgrounds/flights/flight2.jpg',
      },
      {
        name: 'flight3.jpg',
        url: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&q=80', // Airplane window view
        storagePath: 'kayak/backgrounds/flights/flight3.jpg',
      },
      {
        name: 'flight4.webp',
        url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80', // Airport terminal
        storagePath: 'kayak/backgrounds/flights/flight4.webp',
      },
      {
        name: 'flight5.jpg',
        url: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&q=80', // Airplane sunset
        storagePath: 'kayak/backgrounds/flights/flight5.jpg',
      },
      {
        name: 'flight6.jpg',
        url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80', // Airplane takeoff
        storagePath: 'kayak/backgrounds/flights/flight6.jpg',
      },
    ],
    stays: [
      {
        name: 'stays1.webp',
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', // Hotel room
        storagePath: 'kayak/backgrounds/stays/stays1.webp',
      },
      {
        name: 'stays2.jpg',
        url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80', // Hotel lobby
        storagePath: 'kayak/backgrounds/stays/stays2.jpg',
      },
      {
        name: 'stays3.webp',
        url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80', // Resort pool
        storagePath: 'kayak/backgrounds/stays/stays3.webp',
      },
      {
        name: 'stays4.jpg',
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80', // Bedroom
        storagePath: 'kayak/backgrounds/stays/stays4.jpg',
      },
      {
        name: 'stays5.jpg',
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80', // Beach resort
        storagePath: 'kayak/backgrounds/stays/stays5.jpg',
      },
      {
        name: 'stays6.jpeg',
        url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80', // Hotel exterior
        storagePath: 'kayak/backgrounds/stays/stays6.jpeg',
      },
    ],
    cars: [
      {
        name: 'cars1.jpg',
        url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80', // Car on road
        storagePath: 'kayak/backgrounds/cars/cars1.jpg',
      },
      {
        name: 'cars2.jpg',
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80', // Luxury car
        storagePath: 'kayak/backgrounds/cars/cars2.jpg',
      },
      {
        name: 'cars3.jpg',
        url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80', // Car front view
        storagePath: 'kayak/backgrounds/cars/cars3.jpg',
      },
      {
        name: 'cars4.webp',
        url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80', // Sports car
        storagePath: 'kayak/backgrounds/cars/cars4.webp',
      },
      {
        name: 'cars5.jpg',
        url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800&q=80', // Car interior
        storagePath: 'kayak/backgrounds/cars/cars5.jpg',
      },
      {
        name: 'cars6.webp',
        url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80', // Car parking
        storagePath: 'kayak/backgrounds/cars/cars6.webp',
      },
    ],
  };

  console.log('Starting image download and upload to Firebase Storage...\n');

  let successCount = 0;
  let failureCount = 0;

  for (const [category, imageList] of Object.entries(images)) {
    console.log(`\n=== Processing ${category.toUpperCase()} images ===`);
    
    for (const image of imageList) {
      const contentType = getContentType(image.name);
      const result = await downloadAndUpload(image.url, image.storagePath, contentType);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\nCompleted: ${successCount} successful, ${failureCount} failed`);
  
  if (failureCount > 0) {
    console.log('Some images failed to upload. Check the error messages above.');
    process.exit(1);
  }
}

// Run the script
main();

