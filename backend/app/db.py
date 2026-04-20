import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL,
            query       TEXT NOT NULL UNIQUE,
            created_at  TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS price_history (
            id          SERIAL PRIMARY KEY,
            product_id  INT REFERENCES products(id) ON DELETE CASCADE,
            platform    VARCHAR(50) NOT NULL,
            price       NUMERIC(12, 2),
            original_price NUMERIC(12, 2),
            discount_pct   NUMERIC(5, 2),
            url         TEXT,
            title       TEXT,
            image_url   TEXT,
            rating      NUMERIC(3, 1),
            in_stock    BOOLEAN DEFAULT TRUE,
            fetched_at  TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_price_history_product_id
            ON price_history(product_id);
        CREATE INDEX IF NOT EXISTS idx_price_history_fetched_at
            ON price_history(fetched_at DESC);
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database initialized")