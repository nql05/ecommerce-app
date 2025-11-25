"use client";

import Link from "next/link";

export default function LandingPage() {
return (
    <>
      <div className="pt-40">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-black leading-tight">
            Discover extraordinary products and unique experiences from
            trusted sellers around the world
          </h1>
          <Link href="/role" className="btn-primary text-lg">
            Sign In
          </Link>
        </div>
      </div>
    </>
  );
}
