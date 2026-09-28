import { Providers } from "./providers";
import { Inter } from "next/font/google";
import "./globals.css";
import { ScrollToTop } from "@/components/scroll-to-top";
import { headers } from "next/headers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "ScholarPro",
  description: "Scholarship management system",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") || "";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta property="csp-nonce" content={nonce} />
      </head>
      <body
        className={`${inter.variable} antialiased font-sans min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ScrollToTop />
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
