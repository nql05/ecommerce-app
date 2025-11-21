import "../styles/globals.css";
import { AuthProvider } from "../context/AuthProvider";

export const metadata = {
  title: "E-commerce App",
  description: "Modern e-commerce application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
