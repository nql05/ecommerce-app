'use client';

// Seller Dashboard
import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/seller').then(res => setProducts(res.data));
  }, []);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'rgb(9,10,21)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.ProductID} className="card flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{product.ProductName}</div>
                <div className="text-sm text-gray-400">{product.ProductDescription}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary">Edit</button>
                <button className="btn-primary">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
