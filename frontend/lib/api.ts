const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://192.168.180.176:8000";

export async function getVehicles() {
  const response = await fetch(`${API_URL}/vehicles`);
  if (!response.ok) {
    throw new Error("Failed to fetch vehicles");
  }
  return response.json();
}

export async function getOrders() {
  const response = await fetch(`${API_URL}/orders`);
  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }
  return response.json();
}

export async function getDisruptions() {
  const response = await fetch(`${API_URL}/disruptions`);
  if (!response.ok) {
    throw new Error("Failed to fetch disruptions");
  }
  return response.json();
}

export async function getImpact(disruptionId: string) {
  const response = await fetch(
    `${API_URL}/disruptions/${disruptionId}/impact`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch disruption impact");
  }

  return response.json();
}

export async function getRecoveryPlans(disruptionId: string) {
  const response = await fetch(
    `${API_URL}/disruptions/${disruptionId}/recovery`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch recovery plans");
  }

  return response.json();
}

export async function evaluateRecovery(disruptionId: string) {
  const response = await fetch(
    `${API_URL}/disruptions/${disruptionId}/evaluate`
  );

  if (!response.ok) {
    throw new Error("Failed to evaluate recovery plans");
  }

  return response.json();
}

export async function executeRecovery(
  disruptionId: string,
  planId: string
) {
  const response = await fetch(
    `${API_URL}/recovery/execute?disruption_id=${disruptionId}&plan_id=${planId}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to execute recovery");
  }

  return response.json();
}

export async function resetDemo() {
  const response = await fetch(`${API_URL}/demo/reset`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to reset demo");
  }

  return response.json();
}