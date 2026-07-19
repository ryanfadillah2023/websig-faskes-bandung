// Koneksi ke PostgreSQL/PostGIS (satu pool dipakai bersama).
const { Pool } = require("pg");
require("dotenv").config();

const conn =
  process.env.DATABASE_URL ||
  "postgresql://postgres@127.0.0.1:5432/websig_bandung";

// Lokal (127.0.0.1/localhost) tanpa SSL; host cloud (Supabase) wajib SSL.
const isLocal = /127\.0\.0\.1|localhost/.test(conn);

const pool = new Pool({
  connectionString: conn,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

module.exports = pool;
