export const metadata = { title: 'Shipping & returns — Vanilla' };
export default function Shipping() {
  return (
    <section className="container prose">
      <h1>Shipping & returns</h1>
      <h2>Shipping</h2>
      <p>Flat Rs. 200 nationwide. Free above Rs. 5,000. We ship Monday–Saturday within 2 business days of order confirmation. Delivery takes 3–7 business days depending on city.</p>
      <h2>Cash on delivery</h2>
      <p>We accept COD. For orders above Rs. 10,000 we may ask for a partial advance to reduce failed deliveries. We confirm every COD order over WhatsApp or phone before dispatch.</p>
      <h2>Returns</h2>
      <p>We accept returns on unworn, unwashed items within 7 days of delivery. Email <a href="mailto:orders@vanilla.pk">orders@vanilla.pk</a> with your order number and we’ll arrange a pickup. Refunds are processed after the item is returned and inspected.</p>
    </section>
  );
}
