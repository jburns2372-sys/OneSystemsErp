import "dotenv/config";
console.log({
    dbUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL
});
