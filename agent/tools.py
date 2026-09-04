def get_affected_orders(vehicle_id: str) -> list[dict]:
    """Return orders currently assigned to the disrupted vehicle."""

    demo_orders = [
        {
            "order_id": "ORD001",
            "vehicle_id": "V102",
            "customer": "Customer 1",
            "location": "Jubilee Hills",
            "sla_deadline": "15:00",
            "order_value": 1499,
            "priority": "HIGH",
            "customer_tier": "VIP",
            "payment_type": "COD",
        },
        {
            "order_id": "ORD002",
            "vehicle_id": "V102",
            "customer": "Customer 2",
            "location": "Banjara Hills",
            "sla_deadline": "15:10",
            "order_value": 999,
            "priority": "NORMAL",
            "customer_tier": "STANDARD",
            "payment_type": "PREPAID",
        },
        {
            "order_id": "ORD003",
            "vehicle_id": "V103",
            "customer": "Customer 3",
            "location": "Madhapur",
            "sla_deadline": "15:20",
            "order_value": 799,
            "priority": "NORMAL",
            "customer_tier": "STANDARD",
            "payment_type": "COD",
        },
    ]

    return [
        order
        for order in demo_orders
        if order["vehicle_id"] == vehicle_id
    ]

def calculate_sla_risk(order: dict, current_time: str) -> dict:
    """Calculate how much time remains before the order's SLA deadline."""

    from datetime import datetime

    deadline = datetime.strptime(order["sla_deadline"], "%H:%M")
    current = datetime.strptime(current_time, "%H:%M")

    minutes_remaining = int((deadline - current).total_seconds() / 60)

    if minutes_remaining <= 0:
        risk = "BREACHED"
    elif minutes_remaining <= 15:
        risk = "CRITICAL"
    elif minutes_remaining <= 30:
        risk = "HIGH"
    else:
        risk = "LOW"

    return {
        "order_id": order["order_id"],
        "minutes_remaining": minutes_remaining,
        "risk": risk,
    }
def calculate_cod_exposure(orders: list[dict]) -> float:
    """Calculate the total order value currently exposed to COD risk."""

    return sum(
        order["order_value"]
        for order in orders
        if order["payment_type"] == "COD"
    )
def get_vehicle(vehicle_id: str) -> dict | None:
    """Return information about a vehicle."""

    demo_vehicles = [
        {
            "vehicle_id": "V102",
            "location": "Jubilee Hills",
            "capacity": 20,
            "available": False,
            "cost_per_km": 12,
        },
        {
            "vehicle_id": "V103",
            "location": "Banjara Hills",
            "capacity": 20,
            "available": True,
            "cost_per_km": 12,
        },
        {
            "vehicle_id": "V104",
            "location": "Madhapur",
            "capacity": 15,
            "available": True,
            "cost_per_km": 10,
        },
    ]

    for vehicle in demo_vehicles:
        if vehicle["vehicle_id"] == vehicle_id:
            return vehicle

    return None


def find_available_couriers(location: str) -> list[dict]:
    """Find available couriers near the disruption location."""

    demo_couriers = [
        {
            "courier_id": "C17",
            "vehicle_id": "V103",
            "location": "Banjara Hills",
            "available": True,
            "estimated_delay_minutes": 12,
        },
        {
            "courier_id": "C21",
            "vehicle_id": "V104",
            "location": "Madhapur",
            "available": True,
            "estimated_delay_minutes": 18,
        },
        {
            "courier_id": "C08",
            "vehicle_id": "V105",
            "location": "Gachibowli",
            "available": False,
            "estimated_delay_minutes": 30,
        },
    ]

    return [
        courier
        for courier in demo_couriers
        if courier["available"]
    ]
def calculate_reassignment_cost(
    order_count: int,
    estimated_delay_minutes: int,
) -> float:
    """Estimate the cost of reassigning orders to another courier."""

    base_cost = 150
    per_order_cost = 10
    delay_penalty_per_minute = 5

    return (
        base_cost
        + (order_count * per_order_cost)
        + (estimated_delay_minutes * delay_penalty_per_minute)
    )
def calculate_customer_impact(orders: list[dict]) -> dict:
    """Summarize customer impact for affected orders."""

    vip_count = sum(
        1
        for order in orders
        if order["customer_tier"] == "VIP"
    )

    high_priority_count = sum(
        1
        for order in orders
        if order["priority"] == "HIGH"
    )

    return {
        "total_orders": len(orders),
        "vip_customers": vip_count,
        "high_priority_orders": high_priority_count,
    }
def build_impact_summary(
    orders: list[dict],
    current_time: str,
) -> dict:
    """Build a deterministic impact summary for affected orders."""

    sla_risks = [
        calculate_sla_risk(order, current_time)
        for order in orders
    ]

    cod_exposure = calculate_cod_exposure(orders)
    customer_impact = calculate_customer_impact(orders)

    critical_count = sum(
        1
        for item in sla_risks
        if item["risk"] in {"CRITICAL", "BREACHED"}
    )

    return {
        "total_orders": len(orders),
        "critical_sla_orders": critical_count,
        "cod_exposure": cod_exposure,
        "vip_customers": customer_impact["vip_customers"],
        "high_priority_orders": customer_impact["high_priority_orders"],
        "sla_risks": sla_risks,
    }
def build_recovery_options(
    orders: list[dict],
    available_couriers: list[dict],
) -> list[dict]:
    """Generate deterministic recovery options for the disrupted orders."""

    order_count = len(orders)

    options = []

    if available_couriers:
        courier = available_couriers[0]

        cost = calculate_reassignment_cost(
            order_count=order_count,
            estimated_delay_minutes=courier["estimated_delay_minutes"],
        )

        options.append(
            {
                "plan": "REASSIGN_NEAREST_COURIER",
                "courier_id": courier["courier_id"],
                "orders_recovered": order_count,
                "estimated_delay_minutes": courier["estimated_delay_minutes"],
                "cost": cost,
            }
        )

    if len(available_couriers) >= 2:
        first = available_couriers[0]
        second = available_couriers[1]

        options.append(
            {
                "plan": "SPLIT_ACROSS_COURIERS",
                "courier_ids": [
                    first["courier_id"],
                    second["courier_id"],
                ],
                "orders_recovered": order_count,
                "estimated_delay_minutes": min(
                    first["estimated_delay_minutes"],
                    second["estimated_delay_minutes"],
                ),
                "cost": calculate_reassignment_cost(
                    order_count=order_count,
                    estimated_delay_minutes=8,
                ) + 90,
            }
        )

    options.append(
        {
            "plan": "DELAY_NOTIFY_COMPENSATE",
            "orders_recovered": 0,
            "estimated_delay_minutes": 55,
            "cost": 0,
        }
    )

    return options
def evaluate_recovery_options(
    options: list[dict],
) -> dict:
    """Score recovery options and select the best one."""

    scored_options = []

    for option in options:
        delay = option["estimated_delay_minutes"]
        cost = option["cost"]

        if option["orders_recovered"] == 0:
            customer_impact = 100
        else:
            customer_impact = delay * 2

        score = (
            cost * 0.4
            + delay * 10
            + customer_impact * 5
        )

        scored_options.append(
            {
                **option,
                "customer_impact_score": customer_impact,
                "score": round(score, 2),
            }
        )

    best_option = min(
        scored_options,
        key=lambda option: option["score"],
    )

    return {
        "recommended_plan": best_option,
        "all_options": scored_options,
    }
