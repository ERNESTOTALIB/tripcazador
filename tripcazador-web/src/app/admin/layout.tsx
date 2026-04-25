import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — TripCazador",
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
