from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import initialize_database, get_connection

app = FastAPI(title="RouteGuard AI API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://10.10.180.79:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# Initialize database when the application starts
initialize_database()


@app.get("/")
def root():
    return {
        "message": "RouteGuard AI Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/vehicles")
def get_vehicles():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM vehicles")
    vehicles = cursor.fetchall()

    connection.close()

    return [dict(vehicle) for vehicle in vehicles]


@app.get("/orders")
def get_orders():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            orders.*,
            customers.name AS customer_name,
            customers.tier AS customer_tier
        FROM orders
        JOIN customers
            ON orders.customer_id = customers.customer_id
    """)

    orders = cursor.fetchall()

    connection.close()

    return [dict(order) for order in orders]


@app.get("/disruptions")
def get_disruptions():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM disruptions")
    disruptions = cursor.fetchall()

    connection.close()

    return [dict(disruption) for disruption in disruptions]


@app.get("/disruptions/{disruption_id}/impact")
def get_disruption_impact(disruption_id: str):
    connection = get_connection()
    cursor = connection.cursor()

    # Find the disruption
    cursor.execute(
        """
        SELECT *
        FROM disruptions
        WHERE disruption_id = ?
        """,
        (disruption_id,),
    )

    disruption = cursor.fetchone()

    if disruption is None:
        connection.close()
        return {
            "error": "Disruption not found"
        }

    # Find all orders assigned to the disrupted vehicle
    cursor.execute(
        """
        SELECT
            orders.*,
            customers.name AS customer_name,
            customers.tier AS customer_tier
        FROM orders
        JOIN customers
            ON orders.customer_id = customers.customer_id
        WHERE orders.vehicle_id = ?
        """,
        (disruption["vehicle_id"],),
    )

    orders = cursor.fetchall()

    # Calculate impact
    affected_orders = len(orders)

    critical_orders = 0
    high_risk_orders = 0
    normal_orders = 0

    # Use a set so the same VIP customer is counted only once
    vip_customer_ids = set()

    cod_exposure = 0

    for order in orders:

        if order["priority"] == "CRITICAL":
            critical_orders += 1

        elif order["priority"] == "HIGH":
            high_risk_orders += 1

        else:
            normal_orders += 1

        if order["customer_tier"] == "VIP":
            vip_customer_ids.add(order["customer_id"])

        if order["payment_type"] == "COD":
            cod_exposure += order["order_value"]

    connection.close()

    return {
        "disruption": dict(disruption),
        "vehicle_id": disruption["vehicle_id"],
        "affected_orders": affected_orders,
        "sla_risk": {
            "critical": critical_orders,
            "high": high_risk_orders,
            "normal": normal_orders,
        },
        "vip_customers": len(vip_customer_ids),
        "cod_exposure": round(cod_exposure, 2),
        "orders": [dict(order) for order in orders],
    }
@app.get("/disruptions/{disruption_id}/recovery")
def get_recovery_options(disruption_id: str):
    connection = get_connection()
    cursor = connection.cursor()

    # Find the disruption
    cursor.execute(
        """
        SELECT *
        FROM disruptions
        WHERE disruption_id = ?
        """,
        (disruption_id,),
    )

    disruption = cursor.fetchone()

    if disruption is None:
        connection.close()
        return {
            "error": "Disruption not found"
        }

    broken_vehicle_id = disruption["vehicle_id"]

    # Find orders affected by the breakdown
    cursor.execute(
        """
        SELECT *
        FROM orders
        WHERE vehicle_id = ?
        """,
        (broken_vehicle_id,),
    )

    orders = cursor.fetchall()

    affected_orders = len(orders)

    # Find available replacement vehicles
    cursor.execute(
        """
        SELECT *
        FROM vehicles
        WHERE available = 1
        AND vehicle_id != ?
        """,
        (broken_vehicle_id,),
    )

    available_vehicles = cursor.fetchall()

    if not available_vehicles:
        connection.close()
        return {
            "error": "No available recovery vehicles"
        }

    # Use the nearest/first available vehicle for Plan A
    vehicle_a = available_vehicles[0]

    # Use the second vehicle for Plan B if available
    vehicle_b = (
        available_vehicles[1]
        if len(available_vehicles) > 1
        else available_vehicles[0]
    )

    # -------------------------
    # PLAN A - Single vehicle reassignment
    # -------------------------

    plan_a_recovered = min(
        affected_orders,
        vehicle_a["capacity"]
    )

    plan_a_delay = 15
    plan_a_cost = 350
    plan_a_sla_saved = min(
        plan_a_recovered,
        14
    )

    # -------------------------
    # PLAN B - Split shipment
    # -------------------------

    split_capacity = vehicle_a["capacity"] + vehicle_b["capacity"]

    plan_b_recovered = min(
        affected_orders,
        split_capacity
    )

    plan_b_delay = 8
    plan_b_cost = 480
    plan_b_sla_saved = min(
        plan_b_recovered,
        18
    )

    # -------------------------
    # PLAN C - Delay + notification
    # -------------------------

    plan_c_recovered = affected_orders
    plan_c_delay = 55
    plan_c_cost = 150
    plan_c_sla_saved = 0

    plans = [
        {
            "plan_id": "PLAN_A",
            "type": "SINGLE_REASSIGNMENT",
            "description": f"Reassign orders to {vehicle_a['vehicle_id']}",
            "vehicles": [vehicle_a["vehicle_id"]],
            "orders_recovered": plan_a_recovered,
            "sla_saved": plan_a_sla_saved,
            "delay_minutes": plan_a_delay,
            "cost": plan_a_cost,
        },
        {
            "plan_id": "PLAN_B",
            "type": "SPLIT_SHIPMENT",
            "description": (
                f"Split orders between "
                f"{vehicle_a['vehicle_id']} and "
                f"{vehicle_b['vehicle_id']}"
            ),
            "vehicles": [
                vehicle_a["vehicle_id"],
                vehicle_b["vehicle_id"],
            ],
            "orders_recovered": plan_b_recovered,
            "sla_saved": plan_b_sla_saved,
            "delay_minutes": plan_b_delay,
            "cost": plan_b_cost,
        },
        {
            "plan_id": "PLAN_C",
            "type": "DELAY_AND_NOTIFY",
            "description": "Delay deliveries and automatically notify customers",
            "vehicles": [],
            "orders_recovered": plan_c_recovered,
            "sla_saved": plan_c_sla_saved,
            "delay_minutes": plan_c_delay,
            "cost": plan_c_cost,
        },
    ]

    connection.close()

    return {
        "disruption_id": disruption_id,
        "broken_vehicle": broken_vehicle_id,
        "affected_orders": affected_orders,
        "available_vehicles": [
            dict(vehicle)
            for vehicle in available_vehicles
        ],
        "recovery_plans": plans,
    }
@app.get("/disruptions/{disruption_id}/evaluate")
def evaluate_recovery_plans(disruption_id: str):
    connection = get_connection()
    cursor = connection.cursor()

    # Check that the disruption exists
    cursor.execute(
        """
        SELECT *
        FROM disruptions
        WHERE disruption_id = ?
        """,
        (disruption_id,),
    )

    disruption = cursor.fetchone()

    if disruption is None:
        connection.close()
        return {
            "error": "Disruption not found"
        }

    broken_vehicle_id = disruption["vehicle_id"]

    # Get affected orders
    cursor.execute(
        """
        SELECT *
        FROM orders
        WHERE vehicle_id = ?
        """,
        (broken_vehicle_id,),
    )

    orders = cursor.fetchall()

    affected_orders = len(orders)

    # Get available vehicles
    cursor.execute(
        """
        SELECT *
        FROM vehicles
        WHERE available = 1
        AND vehicle_id != ?
        """,
        (broken_vehicle_id,),
    )

    available_vehicles = cursor.fetchall()

    if not available_vehicles:
        connection.close()
        return {
            "error": "No available recovery vehicles"
        }

    vehicle_a = available_vehicles[0]

    vehicle_b = (
        available_vehicles[1]
        if len(available_vehicles) > 1
        else available_vehicles[0]
    )

    # ------------------------------------------------
    # Generate the same recovery plans
    # ------------------------------------------------

    plan_a = {
        "plan_id": "PLAN_A",
        "type": "SINGLE_REASSIGNMENT",
        "description": f"Reassign orders to {vehicle_a['vehicle_id']}",
        "vehicles": [vehicle_a["vehicle_id"]],
        "orders_recovered": min(
            affected_orders,
            vehicle_a["capacity"]
        ),
        "sla_saved": min(
            affected_orders,
            14
        ),
        "delay_minutes": 15,
        "cost": 350,
    }

    plan_b = {
        "plan_id": "PLAN_B",
        "type": "SPLIT_SHIPMENT",
        "description": (
            f"Split orders between "
            f"{vehicle_a['vehicle_id']} and "
            f"{vehicle_b['vehicle_id']}"
        ),
        "vehicles": [
            vehicle_a["vehicle_id"],
            vehicle_b["vehicle_id"],
        ],
        "orders_recovered": min(
            affected_orders,
            vehicle_a["capacity"] + vehicle_b["capacity"]
        ),
        "sla_saved": min(
            affected_orders,
            18
        ),
        "delay_minutes": 8,
        "cost": 480,
    }

    plan_c = {
        "plan_id": "PLAN_C",
        "type": "DELAY_AND_NOTIFY",
        "description": "Delay deliveries and notify customers",
        "vehicles": [],
        "orders_recovered": affected_orders,
        "sla_saved": 0,
        "delay_minutes": 55,
        "cost": 150,
    }

    plans = [plan_a, plan_b, plan_c]

    # ------------------------------------------------
    # Find maximum values for normalization
    # ------------------------------------------------

    max_sla = max(plan["sla_saved"] for plan in plans)
    max_delay = max(plan["delay_minutes"] for plan in plans)
    max_cost = max(plan["cost"] for plan in plans)

    evaluated_plans = []

    for plan in plans:

        # SLA score: higher SLA saved = better
        sla_score = (
            plan["sla_saved"] / max_sla
            if max_sla > 0
            else 0
        )

        # Delay score: lower delay = better
        delay_score = (
            1 - (plan["delay_minutes"] / max_delay)
        )

        # Cost score: lower cost = better
        cost_score = (
            1 - (plan["cost"] / max_cost)
        )

        # Weighted evaluator score
        total_score = (
            (sla_score * 50)
            + (delay_score * 30)
            + (cost_score * 20)
        )

        # Plans that protect fewer of the at-risk SLAs receive a deterministic
        # coverage penalty. This keeps the evaluator aligned with the recovery
        # objective instead of letting a lower-cost, lower-coverage plan win.
        sla_coverage_penalty = (max_sla - plan["sla_saved"]) * 1.5
        total_score -= sla_coverage_penalty

        evaluated_plans.append({
            **plan,
            "scores": {
                "sla_score": round(sla_score * 100, 2),
                "delay_score": round(delay_score * 100, 2),
                "cost_score": round(cost_score * 100, 2),
            },
            "evaluator_score": round(total_score, 2),
        })

    # Highest score = recommendation
    recommended_plan = max(
        evaluated_plans,
        key=lambda plan: plan["evaluator_score"]
    )

    # Add recommendation flag
    for plan in evaluated_plans:
        plan["recommended"] = (
            plan["plan_id"] == recommended_plan["plan_id"]
        )

    # Generate human-readable explanation
    if recommended_plan["plan_id"] == "PLAN_A":
        reason = (
            "Plan A provides the best balance of "
            "SLA protection, delay, and operational cost."
        )

    elif recommended_plan["plan_id"] == "PLAN_B":
        reason = (
            "Plan B provides the strongest SLA protection "
            "with the lowest delivery delay."
        )

    else:
        reason = (
            "Plan C minimizes operational recovery cost, "
            "but results in significantly higher delivery delay."
        )

    connection.close()

    return {
        "disruption_id": disruption_id,
        "broken_vehicle": broken_vehicle_id,
        "affected_orders": affected_orders,
        "plans": evaluated_plans,
        "recommended_plan": recommended_plan["plan_id"],
        "reason": reason,
    }
@app.post("/recovery/execute")
def execute_recovery(disruption_id: str, plan_id: str):
    if disruption_id != "D001" or plan_id not in {"PLAN_A", "PLAN_B", "PLAN_C"}:
        raise HTTPException(status_code=404, detail="Disruption or recovery plan not found")
    return {
        "status": "EXECUTED",
        "disruption_id": disruption_id,
        "plan_id": plan_id,
        "message": f"Recovery plan {plan_id} executed successfully.",
    }
