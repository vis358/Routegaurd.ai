from typing import TypedDict, Any


class RouteGuardState(TypedDict, total=False):
    disruption: dict[str, Any]
    affected_orders: list[dict[str, Any]]
    impact: dict[str, Any]
    recovery_options: list[dict[str, Any]]
    recommendation: dict[str, Any]
    approval: bool
    execution_result: dict[str, Any]