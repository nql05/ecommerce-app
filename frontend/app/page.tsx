"use client";

import Link from "next/link";

export default function Home() {
  // TODO: Implement API call to fetch products
  // const [products, setProducts] = useState([]);
  // useEffect(() => {
  //   api.get('/products').then(res => setProducts(res.data || []));
  // }, []);

  return (
    <>
      <div className="pt-40">
          <div className="max-w-4xl space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-black leading-tight">
              Discover extraordinary products and unique experiences from
              trusted sellers around the world
            </h1>
            <Link href="/login" className="btn-primary text-lg">
              Sign In
            </Link>
          </div>
      </div>
    </>
  );
}
