import requests
from agent.state import RouteGuardState

from agent.tools import (
    get_affected_orders,
    build_impact_summary,
    build_recovery_options,
    find_available_couriers,
    evaluate_recovery_options,
)

import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv("agent/.env")

llm_client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=os.getenv("FEATHERLESS_API_KEY"),
)

MODEL = "moonshotai/Kimi-K3"
BACKEND_URL = "http://127.0.0.1:8000"

def generate_recommendation_reason(
    impact: dict,
    recommendation: dict,
) -> str:
    """Ask Kimi K3 to explain the selected recovery plan."""

    prompt = f"""
You are RouteGuard AI, an autonomous last-mile delivery recovery agent.

Operational impact:
{impact}

Selected recovery plan:
{recommendation}

Explain in 2 concise sentences why this plan is recommended.
Mention cost, delay, SLA impact, and customer impact.
Use only numbers explicitly present in the operational impact or selected recovery plan.
Do not claim that specific customer groups or SLA-risk groups were saved unless the data explicitly proves it.
Do not invent or infer relationships between metrics.
"""

    response = llm_client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content.strip()

def detection_agent(state: RouteGuardState) -> RouteGuardState:
    """Detect and register a vehicle breakdown."""

    disruption = state["disruption"]

    if disruption["type"] != "VEHICLE_BREAKDOWN":
        return state

    affected_orders = get_affected_orders(
        disruption["vehicle_id"]
    )

    return {
        **state,
        "affected_orders": affected_orders,
    }

from agent.tools import build_impact_summary


def impact_agent(state: RouteGuardState) -> RouteGuardState:
    disruption_id = state["disruption"]["disruption_id"]

    response = requests.get(
        f"{BACKEND_URL}/disruptions/{disruption_id}/impact",
        timeout=10,
    )
    response.raise_for_status()

    impact = response.json()

    return {
        **state,
        "affected_orders": impact["orders"],
        "impact": impact,
    }
from agent.tools import build_recovery_options, find_available_couriers


def recovery_planner_agent(state: RouteGuardState) -> RouteGuardState:
    disruption_id = state["disruption"]["disruption_id"]

    response = requests.get(
        f"{BACKEND_URL}/disruptions/{disruption_id}/recovery",
        timeout=10,
    )
    response.raise_for_status()

    recovery = response.json()

    return {
        **state,
        "recovery_options": recovery["recovery_plans"],
    }
from agent.tools import evaluate_recovery_options

def evaluator_agent(state: RouteGuardState) -> RouteGuardState:
    disruption_id = state["disruption"]["disruption_id"]

    response = requests.get(
        f"{BACKEND_URL}/disruptions/{disruption_id}/evaluate",
        timeout=10,
    )
    response.raise_for_status()

    evaluation = response.json()

    best_plan = next(
        plan for plan in evaluation["plans"]
        if plan["plan_id"] == evaluation["recommended_plan"]
    )

    reason = generate_recommendation_reason(
        impact=state["impact"],
        recommendation=best_plan,
    )

    return {
        **state,
        "recommendation": {
            "recommended_plan": best_plan,
            "all_options": evaluation["plans"],
            "reason": reason,
        },
    }
if __name__ == "__main__":
    initial_state: RouteGuardState = {
        "disruption": {
            "disruption_id": "D001",
            "type": "VEHICLE_BREAKDOWN",
            "vehicle_id": "V102",
            "location": "Jubilee Hills",
            "severity": "CRITICAL",
        }
    }

    result = routeguard_graph.invoke(initial_state) # type: ignore

    print("\n=== ROUTEGUARD RESULT ===")
    print(result["recommendation"])

def approval_agent(state: RouteGuardState) -> RouteGuardState:
    """Pause for human approval before execution."""

    print("\n=== HUMAN APPROVAL REQUIRED ===")
    print("Recommended plan:")
    print(state["recommendation"]["recommended_plan"])
    print("\nReason:")
    print(state["recommendation"]["reason"])

    approval = input("\nApprove this recovery plan? (yes/no): ").strip().lower()

    return {
        **state,
        "approval": approval == "yes",
    }

def execution_agent(state: RouteGuardState) -> RouteGuardState:
    """Execute the approved recovery plan."""

    if not state.get("approval", False):
        return {
            **state,
            "execution_result": {
                "status": "REJECTED",
                "message": "Recovery plan was not approved.",
            },
        }

    plan = state["recommendation"]["recommended_plan"]

    return {
        **state,
        "execution_result": {
            "status": "EXECUTED",
            "plan": plan["plan"],
            "courier_id": plan.get("courier_id"),
            "orders_recovered": plan["orders_recovered"],
            "message": "Recovery plan executed successfully.",
        },
    }