export const metadata = { title: 'Size guide — Vanilla' };
export default function SizeGuide() {
  return (
    <section className="container prose">
      <h1>Size guide</h1>
      <p>Measurements are of the garment, laid flat. If you're between sizes, size up for an oversized fit.</p>
      <h2>Sweatshirts (cm)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th>Size</th><th>Chest</th><th>Length</th></tr></thead>
        <tbody>
          <tr><td>S</td><td>102</td><td>68</td></tr>
          <tr><td>M</td><td>108</td><td>70</td></tr>
          <tr><td>L</td><td>114</td><td>72</td></tr>
          <tr><td>XL</td><td>120</td><td>74</td></tr>
        </tbody>
      </table>
      <h2>Sweatpants (cm)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th>Size</th><th>Waist</th><th>Inseam</th></tr></thead>
        <tbody>
          <tr><td>S</td><td>72</td><td>74</td></tr>
          <tr><td>M</td><td>78</td><td>75</td></tr>
          <tr><td>L</td><td>84</td><td>76</td></tr>
          <tr><td>XL</td><td>90</td><td>77</td></tr>
        </tbody>
      </table>
    </section>
  );
}
