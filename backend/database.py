import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).parent / "routeguard.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()
    cursor = connection.cursor()

    # Customers
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            customer_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            tier TEXT NOT NULL,
            location TEXT
        )
    """)

    # Vehicles
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vehicles (
            vehicle_id TEXT PRIMARY KEY,
            driver TEXT NOT NULL,
            location TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            available INTEGER NOT NULL DEFAULT 1,
            cost_per_km REAL NOT NULL
        )
    """)

    # Orders
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            vehicle_id TEXT,
            location TEXT NOT NULL,
            sla_deadline TEXT NOT NULL,
            order_value REAL NOT NULL,
            priority TEXT NOT NULL,
            payment_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'IN_TRANSIT',
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
        )
    """)

    # Disruptions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS disruptions (
            disruption_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            vehicle_id TEXT NOT NULL,
            location TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            severity TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
        )
    """)

    # Recovery plans
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recovery_plans (
            plan_id TEXT PRIMARY KEY,
            disruption_id TEXT NOT NULL,
            plan_type TEXT NOT NULL,
            description TEXT NOT NULL,
            vehicle_ids TEXT,
            orders_recovered INTEGER NOT NULL,
            sla_saved INTEGER NOT NULL,
            delay_minutes INTEGER NOT NULL,
            cost REAL NOT NULL,
            customer_impact_score REAL NOT NULL,
            evaluator_score REAL,
            recommended INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'PROPOSED',
            FOREIGN KEY (disruption_id) REFERENCES disruptions(disruption_id)
        )
    """)

    connection.commit()
    connection.close()


if __name__ == "__main__":
    initialize_database()
    print(f"Database initialized: {DATABASE_PATH}")