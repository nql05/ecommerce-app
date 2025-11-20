"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        // Attempt to connect
        await prisma.$connect();
        console.log('Database connected successfully!');
        const count = await prisma.buyer.count();
        console.log(`Found ${count} users in the database.`);
    }
    catch (error) {
        console.error('Connection failed:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
