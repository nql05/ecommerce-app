import Layout from "../../components/AppLayout";

export default function RoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Layout>
        <main>{children}</main>
      </Layout>
    </>
  );
}