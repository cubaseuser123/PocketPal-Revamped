import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const nuke = async () => {
    // 1. Safety Check: Production
    if (process.env.NODE_ENV === 'production') {
        console.error('⛔️ CRITICAL SAFETY ERROR: You are attempting to nuke the PRODUCTION database.');
        console.error('This action is disabled in production environments.');
        process.exit(1);
    }

    const readline = (await import('readline')).createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // 2. Safety Check: User Confirmation
    readline.question('⚠️  WARNING: You are about to DESTROY all data in the database.\nType "delete my data" to confirm: ', async (answer) => {
        readline.close();
        
        if (answer !== 'delete my data') {
            console.log('❌ Operation cancelled. Data is safe.');
            process.exit(0);
        }

        try {
            await connectDB();
            
            console.log('💥 Nuking Database...');
            
            // Get all collections
            const collections = await mongoose.connection.db.collections();
            
            for (let collection of collections) {
                console.log(`Deleting ${collection.collectionName}...`);
                await collection.deleteMany({});
            }

            console.log('✅ Database Nuked Successfully');
            process.exit();
        } catch (error) {
            console.error('Error nuking database:', error);
            process.exit(1);
        }
    });
};

nuke();
