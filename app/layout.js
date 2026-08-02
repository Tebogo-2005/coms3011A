import "./globals.css";

export const metadata = {
  title: "Todo — COMS3011A",
  description: "Local-first todo application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
