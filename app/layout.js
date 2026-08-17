import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata = {
  title: 'Hệ thống Quản lý Mẫu NIPT & Phôi Kết quả GeneTrust',
  description: 'Quản lý thông tin thai phụ, tự động đọc cfDNA và kết quả từ PDF, xuất phôi kết quả GeneTrust y khoa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${plusJakarta.className} bg-slate-50 text-slate-900 min-h-screen antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
