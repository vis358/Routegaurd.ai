from datetime import datetime, timezone
from database import get_connection, initialize_database


def seed_database():
    initialize_database()

    connection = get_connection()
    cursor = connection.cursor()

    # Clear existing demo data so the script can be safely re-run
    cursor.execute("DELETE FROM recovery_plans")
    cursor.execute("DELETE FROM disruptions")
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM vehicles")
    cursor.execute("DELETE FROM customers")

    # -------------------------
    # CUSTOMERS
    # -------------------------
    customers = [
        ("C001", "Customer 1", "VIP", "Jubilee Hills"),
        ("C002", "Customer 2", "VIP", "Banjara Hills"),
        ("C003", "Customer 3", "VIP", "Madhapur"),
        ("C004", "Customer 4", "STANDARD", "Jubilee Hills"),
        ("C005", "Customer 5", "STANDARD", "Madhapur"),
        ("C006", "Customer 6", "STANDARD", "Kukatpally"),
        ("C007", "Customer 7", "STANDARD", "Banjara Hills"),
        ("C008", "Customer 8", "STANDARD", "Jubilee Hills"),
        ("C009", "Customer 9", "STANDARD", "Madhapur"),
        ("C010", "Customer 10", "STANDARD", "Kukatpally"),
    ]

    cursor.executemany(
        """
        INSERT INTO customers
        (customer_id, name, tier, location)
        VALUES (?, ?, ?, ?)
        """,
        customers,
    )

    # -------------------------
    # VEHICLES
    # -------------------------
    vehicles = [
        ("V102", "Driver 102", "Jubilee Hills", 20, 0, 12),
        ("V103", "Driver 103", "Banjara Hills", 20, 1, 12),
        ("V105", "Driver 105", "Madhapur", 15, 1, 14),
        ("V108", "Driver 108", "Kukatpally", 20, 1, 11),
    ]

    cursor.executemany(
        """
        INSERT INTO vehicles
        (vehicle_id, driver, location, capacity, available, cost_per_km)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        vehicles,
    )

    # -------------------------
    # ORDERS
    # -------------------------
    orders = []

    locations = [
        "Jubilee Hills",
        "Banjara Hills",
        "Madhapur",
        "Kukatpally",
    ]

    for i in range(1, 21):
        customer_id = f"C{((i - 1) % 10) + 1:03d}"

        if i <= 6:
            priority = "CRITICAL"
            sla_deadline = "15:00"
        elif i <= 14:
            priority = "HIGH"
            sla_deadline = "15:20"
        else:
            priority = "NORMAL"
            sla_deadline = "16:00"

        location = locations[(i - 1) % len(locations)]
        order_value = 999 + (i * 100)

        payment_type = "COD" if i % 2 == 0 else "PREPAID"

        orders.append(
            (
                f"ORD{i:03d}",
                customer_id,
                "V102",
                location,
                sla_deadline,
                order_value,
                priority,
                payment_type,
                "IN_TRANSIT",
            )
        )

    cursor.executemany(
        """
        INSERT INTO orders
        (
            order_id,
            customer_id,
            vehicle_id,
            location,
            sla_deadline,
            order_value,
            priority,
            payment_type,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        orders,
    )

    # -------------------------
    # DISRUPTION
    # -------------------------
    cursor.execute(
        """
        INSERT INTO disruptions
        (
            disruption_id,
            type,
            vehicle_id,
            location,
            timestamp,
            severity,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "D001",
            "VEHICLE_BREAKDOWN",
            "V102",
            "Jubilee Hills",
            datetime.now(timezone.utc).isoformat(),
            "CRITICAL",
            "ACTIVE",
        ),
    )

    connection.commit()
    connection.close()

    print("RouteGuard demo data seeded successfully.")
    print("Customers: 10")
    print("Vehicles: 4")
    print("Affected orders: 20")
    print("Active disruption: D001 / V102 breakdown")


if __name__ == "__main__":
    seed_database()
