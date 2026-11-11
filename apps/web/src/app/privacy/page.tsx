export const metadata = { title: 'Privacy — Vanilla' };
export default function Privacy() {
  return (
    <section className="container prose">
      <h1>Privacy policy</h1>
      <p>We collect the information you give us at checkout — name, email, phone, delivery address — so we can process and ship your order. We don’t sell it. We share only what the courier and payment gateway need to deliver and bill.</p>
      <h2>Cookies</h2>
      <p>We use a cart cookie to remember your bag across visits, and analytics cookies (GA4, Meta Pixel) so we can see where buyers drop off. You can block these in your browser.</p>
      <h2>Contact</h2>
      <p>Write to <a href="mailto:privacy@vanilla.pk">privacy@vanilla.pk</a> to request deletion of your data.</p>
    </section>
  );
}
