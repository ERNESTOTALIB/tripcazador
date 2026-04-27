import type { Metadata } from "next";
import { UpgradeCalculator } from "@/components/UpgradeCalculator";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Calculadora probabilidad upgrade business class gratis 2026",
  description:
    "Estima probabilidad de upgrade gratis a business class según fare class + status + ruta + temporada. Tips para maximizar odds. Datos FlyerTalk.",
  alternates: { canonical: "/calculadora-upgrade" },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function CalculadoraUpgradePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Calculadora upgrade business — TripCazador",
      url: "https://tripcazador.com/calculadora-upgrade",
      applicationCategory: "TravelApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Calculadora upgrade",
          item: "https://tripcazador.com/calculadora-upgrade",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Calculadora upgrade</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Calculadora upgrade business class</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Estima tu probabilidad real de upgrade gratis a business. Combina fare class + status frequent flyer + tipo ruta + temporada.
        </p>
      </header>

      <UpgradeCalculator />

      <section className="space-y-3 prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-white">Cómo funciona el upgrade gratis</h2>
        <p className="text-gray-300">
          Las aerolíneas hacen <strong>operational upgrades</strong> cuando una cabina superior tiene menos pasajeros que la inferior + algunos pasajeros revenue-management quieren mantener clientes premium contentos. La probabilidad depende de:
        </p>
        <ol className="text-gray-300 space-y-2">
          <li><strong>Tu fare class</strong>: tarifas Y/B/M tienen prioridad sobre Q/T/L. Las profundamente descontadas casi nunca upgradean.</li>
          <li><strong>Tu status</strong>: Gold/Platinum tienen prioridad fija. Sin status, casi imposible salvo cabin load excepcional.</li>
          <li><strong>Cabin load</strong>: si business tiene 50% ocupación y economy 100%, hay candidatos para upgrade.</li>
          <li><strong>Temporada</strong>: en pico turístico (julio, navidad), business también va lleno. Nunca upgrades.</li>
        </ol>
        <h3 className="text-xl font-bold text-white pt-4">Operational vs Mileage Upgrade</h3>
        <p className="text-gray-300">
          <strong>Operational upgrade</strong>: gratis, decisión de aerolínea. Esta calculadora estima eso.
        </p>
        <p className="text-gray-300">
          <strong>Mileage upgrade</strong>: pagas con millas (50K-150K segun ruta). Casi siempre disponible si tienes millas. NO requiere status.
        </p>
        <p className="text-gray-300">
          <strong>Cash upgrade</strong>: pagas en check-in (€200-1500). Disponible casi siempre, depende de cabin load.
        </p>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">Quiero saber más sobre status journey</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Lee nuestra guía completa "Million miler journey" en inglés con estrategias para conseguir status que abre puertas a upgrades constantes.
        </p>
        <a
          href="/en/blog/million-miler-status-journey-optimization-2026"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Leer guía →
        </a>
      </section>
    </div>
  );
}
