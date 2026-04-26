import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatbizzy",
  description: "RAG chatbot built on Next.js, Gemini, and pgvector",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
