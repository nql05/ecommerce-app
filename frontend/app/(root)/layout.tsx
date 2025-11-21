import Header from "../../components/Header";
import Layout from "../../components/AppLayout";

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <Layout>
        <main>{children}</main>
      </Layout>
    </>
  );
}
