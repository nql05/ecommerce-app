export const API_PATHS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout'
    },
    
    // Buyer APIs
    BUYER: {
        PRODUCTS: {
            LIST: '/api/buyer/products',
            SEARCH: '/api/buyer/products/search',
            DETAIL: (productId: string) => `/api/buyer/products/${productId}`,
            COMMENTS: (productId: string) => `/api/buyer/products/${productId}/comments`
        },
        CART: {
            GET: '/api/buyer/cart',
            ADD: '/api/buyer/cart/add',
            UPDATE: '/api/buyer/cart/update',
            REMOVE: '/api/buyer/cart/remove'
        },
        ORDER: {
            CREATE: '/api/buyer/order/create',
            DETAIL: (orderId: string) => `/api/buyer/order/${orderId}`,
            LIST: '/api/buyer/orders/skus'
        }
    },
    
    // Seller APIs
    SELLER: {
        PRODUCTS: {
            LIST: '/api/seller/products',
            SEARCH: '/api/seller/products/search',
            DETAIL: (productId: string) => `/api/seller/products/${productId}`,
            UPDATE: '/api/seller/products/update',
            UPDATE_SKU: '/api/seller/products/update-sku',
            DELETE: (productId: string) => `/api/seller/products/${productId}`
        },
        ORDERS: {
            LIST: '/api/seller/or9ders',
            DETAIL: (orderId: string) => `/api/seller/orders/${orderId}`
        }
    },
    
    // Admin APIs (placeholder for future implementation)
    ADMIN: {
        // To be implemented later
    }
}