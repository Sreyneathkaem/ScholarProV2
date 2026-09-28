import { Providers } from "./providers";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ScrollToTop } from "@/components/scroll-to-top";
import { headers } from "next/headers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "ScholarPro",
  description: "Scholarship management",
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
        className={`${poppins.variable} antialiased font-poppins min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ScrollToTop />
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
