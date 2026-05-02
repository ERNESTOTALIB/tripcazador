import type { Metadata } from "next";
import { SectionHero } from "@/components/SectionHero";
import { ReferralPanel } from "@/components/ReferralPanel";

export const metadata: Metadata = {
  title: "Programa de referidos — Invita y gana 1 mes Premium",
  description:
    "Comparte TripCazador con tus amigos. Cuando alguien se hace Premium con tu código, ambos ganáis 1 mes de Premium gratis.",
  alternates: { canonical: "/refer" },
};

export const revalidate = 3600;

export default function ReferPage() {
  return (
    <div className="space-y-12">
      <SectionHero
        size="tall"
        badge="🎁 Win-win sin condiciones ocultas"
        title={
          <>
            Invita amigos, ganas <em>Premium</em> gratis
          </>
        }
        subtitle="Cuando alguien se hace Premium usando tu código, ambos ganáis 1 mes de Premium gratis. Sin límite de invitaciones."
      />

      <ReferralPanel />

      <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">¿Cómo funciona?</h2>
        <ol className="space-y-4 text-sm text-gray-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-amber-500 text-black font-bold rounded-full flex items-center justify-center text-sm">1</span>
            <div>
              <strong className="text-white">Copia tu link único</strong> arriba o
              compártelo directamente por WhatsApp/Telegram/Twitter con el botón.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-amber-500 text-black font-bold rounded-full flex items-center justify-center text-sm">2</span>
            <div>
              <strong className="text-white">Tu amigo entra y se hace Premium</strong> (con tu código pre-aplicado).
              Recibe 7 días gratis automáticos.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-amber-500 text-black font-bold rounded-full flex items-center justify-center text-sm">3</span>
            <div>
              <strong className="text-white">Ambos ganáis 1 mes Premium gratis</strong> automáticamente.
              No hay códigos manuales, no hay límite — invita a 12 amigos y tienes 1 año Premium gratis.
            </div>
          </li>
        </ol>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
          <h3 className="font-bold text-amber-400 mb-2">¿Hay tope de referidos?</h3>
          <p className="text-sm text-gray-300">
            No. Cada amigo que se haga Premium con tu código te suma 1 mes adicional.
            Si invitas 12 amigos en un mes, tienes 1 año Premium completamente gratis.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
          <h3 className="font-bold text-amber-400 mb-2">¿Mi amigo necesita pagar?</h3>
          <p className="text-sm text-gray-300">
            El amigo activa los 7 días de prueba gratuitos como cualquier otro nuevo usuario.
            Si decide quedarse Premium tras los 7 días, ambos ganáis vuestro mes gratis.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
          <h3 className="font-bold text-amber-400 mb-2">¿Y si yo aún no soy Premium?</h3>
          <p className="text-sm text-gray-300">
            Cuando recibas tu primer mes gratis, tu cuenta pasa automáticamente a
            Premium. No tienes que pagar nada para empezar a invitar.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
          <h3 className="font-bold text-amber-400 mb-2">¿Cuándo expiran los meses?</h3>
          <p className="text-sm text-gray-300">
            Se acumulan. Si tienes 5 meses ganados y empiezas a usarlos hoy,
            tienes Premium hasta dentro de 5 meses sin pagar nada.
          </p>
        </div>
      </section>
    </div>
  );
}
