export const API_PATHS = {
    // Authentication - All Users
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout'
    },

    // Buyer APIs
    BUYER: {
        PRODUCTS: {
            LIST: '/buyer/products',                                    // Get all products (all sellers)
            SEARCH: '/buyer/products/search',                           // Search all products
            DETAIL: (productId: string) => `/buyer/products/${productId}`,  // Product detail
        },
        CART: {
            GET: '/buyer/cart',
        },
        ORDER: {
            CREATE: '/buyer/order/create',
            DETAIL: (orderId: string) => `/buyer/order/${orderId}`,
        }
    },

    // Seller APIs
    SELLER: {
        PRODUCTS: {
            LIST: '/seller/products',                                   // Get only seller's shop products
            SEARCH: '/seller/products/search',                          // Search seller's shop products
            DETAIL: (productId: string) => `/seller/products/${productId}`,
            ADD: '/seller/products/add',
        },
    },

    // Admin APIs (placeholder for future implementation)
    ADMIN: {
        SELLER_LIST: '/admin/sellers',
        SELLER_DETAIL: (sellerId: string) => `/admin/sellers/${sellerId}`,
        BUYER_LIST: '/admin/buyers',
        BUYER_DETAIL: (buyerId: string) => `/admin/buyers/${buyerId}`
    }
}
