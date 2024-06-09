import "@/styles/globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Esmeralda Pinkie Promise",
  description: ""
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-pink-900 h-screen text-pink-100">{children}</body>
    </html>
  );
}
