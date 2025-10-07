import './globals.css';

export const metadata = {
  title: 'Free Meal Monitoring System',
  description: 'Track employee meal claims1334683099 using RFID technology',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body 
        className="min-h-screen bg-gray-100" 
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}