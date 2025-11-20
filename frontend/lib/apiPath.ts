export const API_PATHS = {
    // Authentication - All Users
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout'
    },

    // Buyer APIs
    BUYER: {
        PRODUCTS: {
            LIST: '/api/buyer/products',                                    // Get all products (all sellers)
            SEARCH: '/api/buyer/products/search',                           // Search all products
            DETAIL: (productId: string) => `/api/buyer/products/${productId}`,  // Product detail
        },
        CART: {
            GET: '/api/buyer/cart',
        },
        ORDER: {
            CREATE: '/api/buyer/order/create',
            DETAIL: (orderId: string) => `/api/buyer/order/${orderId}`,
        }
    },

    // Seller APIs
    SELLER: {
        PRODUCTS: {
            LIST: '/api/seller/products',                                   // Get only seller's shop products
            SEARCH: '/api/seller/products/search',                          // Search seller's shop products
            DETAIL: (productId: string) => `/api/seller/products/${productId}`,
            ADD: '/api/seller/products/add',
        },
    },

    // Admin APIs (placeholder for future implementation)
    ADMIN: {
        SELLER_LIST: '/api/admin/sellers',
        SELLER_DETAIL: (sellerId: string) => `/api/admin/sellers/${sellerId}`,
        BUYER_LIST: '/api/admin/buyers',
        BUYER_DETAIL: (buyerId: string) => `/api/admin/buyers/${buyerId}`
    }
}
