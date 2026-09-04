export interface Vehicle { vehicle_id: string; driver: string; location: string; capacity: number; available: number | boolean; cost_per_km: number }
export interface Order { order_id: string; customer_id: string; customer_name?: string; customer_tier?: string; vehicle_id: string | null; location: string; sla_deadline: string; order_value: number; priority: string; payment_type: string; status: string }
export interface Disruption { disruption_id: string; type: string; vehicle_id: string; location: string; timestamp: string; severity: string; status: string }
export interface Impact { disruption: Disruption; vehicle_id: string; affected_orders: number; sla_risk: { critical: number; high: number; normal: number }; vip_customers: number; cod_exposure: number; orders: Order[] }
export interface RecoveryPlan { plan_id: string; type: string; description: string; vehicles: string[]; orders_recovered: number; sla_saved: number; delay_minutes: number; cost: number; evaluator_score?: number; recommended?: boolean }
export interface Recovery { disruption_id: string; broken_vehicle: string; affected_orders: number; available_vehicles: Vehicle[]; recovery_plans: RecoveryPlan[] }
export interface Evaluation { disruption_id: string; broken_vehicle: string; affected_orders: number; plans: RecoveryPlan[]; recommended_plan: string; reason: string }
export interface ExecutionResult { status: "EXECUTED"; disruption_id: string; plan_id: string; message: string }

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`${apiUrl}${path}`, { ...options, cache: "no-store" }); }
  catch { throw new Error("Backend unavailable. Check that RouteGuard API is running."); }
  if (!response.ok) throw new Error(`RouteGuard API request failed (${response.status}).`);
  return response.json() as Promise<T>;
}
export const getHealth = () => request<{ status: string }>("/health");
export const getVehicles = () => request<Vehicle[]>("/vehicles");
export const getOrders = () => request<Order[]>("/orders");
export const getDisruptions = () => request<Disruption[]>("/disruptions");
export const getImpact = (id: string) => request<Impact>(`/disruptions/${encodeURIComponent(id)}/impact`);
export const getRecoveryPlans = (id: string) => request<Recovery>(`/disruptions/${encodeURIComponent(id)}/recovery`);
export const evaluateRecovery = (id: string) => request<Evaluation>(`/disruptions/${encodeURIComponent(id)}/evaluate`);
export const executeRecovery = (disruptionId: string, planId: string) => request<ExecutionResult>(`/recovery/execute?disruption_id=${encodeURIComponent(disruptionId)}&plan_id=${encodeURIComponent(planId)}`, { method: "POST" });
