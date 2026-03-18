import './globals.css';
import './admin.css';

export const metadata = {
  title: "Lin's Happy Bowl – Domácí jídla na objednávku",
  description: "Lin's Happy Bowl – čerstvá domácí jídla připravená s láskou. Objednejte si každý den ze 4 variant jídel s doručením až k vám.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
