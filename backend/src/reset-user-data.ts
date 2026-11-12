// Clears user-generated data: carts, orders. Keeps products, admin, discounts, settings.
import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!;

  const toClear = ['carts', 'orders'];
  for (const name of toClear) {
    const r = await db.collection(name).deleteMany({});
    console.log(`[reset] cleared ${name}: ${r.deletedCount} docs`);
  }

  // Reset discount usage counter if present
  const d = await db.collection('discounts').updateMany({}, { $set: { usageCount: 0 } });
  console.log(`[reset] reset ${d.modifiedCount} discount usage counts to 0`);

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
