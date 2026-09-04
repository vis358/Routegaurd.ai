from langgraph.graph import StateGraph, START, END

from agent.state import RouteGuardState
from agent.agents import (
    detection_agent,
    impact_agent,
    recovery_planner_agent,
    evaluator_agent,
    approval_agent,
    execution_agent,
)


builder = StateGraph(RouteGuardState)

builder.add_node("detection", detection_agent)
builder.add_node("impact", impact_agent)
builder.add_node("recovery_planner", recovery_planner_agent)
builder.add_node("evaluator", evaluator_agent)
builder.add_node("approval", approval_agent)
builder.add_node("execution", execution_agent)

builder.add_edge(START, "detection")
builder.add_edge("detection", "impact")
builder.add_edge("impact", "recovery_planner")
builder.add_edge("recovery_planner", "evaluator")
builder.add_edge("evaluator", "approval")
builder.add_edge("approval", "execution")
builder.add_edge("execution", END)

routeguard_graph = builder.compile()

