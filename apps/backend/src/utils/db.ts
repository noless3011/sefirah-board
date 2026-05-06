import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";

const { Pool } = pg;

// 1. Create a standard Postgres connection pool
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// 2. Wrap the pool in the Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter into the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

export default prisma;
