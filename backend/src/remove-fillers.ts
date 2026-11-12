import 'dotenv/config';
import mongoose from 'mongoose';

const FILLERS = ['mill-crewneck', 'ravi-crewneck', 'mill-sweatpant', 'ravi-sweatpant'];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const col = mongoose.connection.db!.collection('products');
  const r = await col.deleteMany({ slug: { $in: FILLERS } });
  console.log(`[remove-fillers] deleted ${r.deletedCount} products:`, FILLERS);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
