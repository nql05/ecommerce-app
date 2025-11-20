import "../styles/globals.css";
import { AuthProvider } from "../context/AuthProvider";
import Header from "../components/Header";
import Layout from "../components/Layout";

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
        <AuthProvider>
          <Header />
          <Layout>
            <main>{children}</main>
          </Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
