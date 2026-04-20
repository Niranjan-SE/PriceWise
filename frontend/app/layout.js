import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PriceWise India — Smart Price Comparison',
  description: 'Compare prices across Amazon, Flipkart, Croma & Reliance Digital. AI-powered advice on when to buy.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#080808] antialiased`}>
        {children}
      </body>
    </html>
  );
}
