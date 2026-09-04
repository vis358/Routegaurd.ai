"use client";

import { useEffect, useState } from "react";
import {
  getDisruptions,
  getImpact,
  getRecoveryPlans,
  evaluateRecovery,
  executeRecovery,
  resetDemo,
} from "@/lib/api";
type PlanId = "PLAN_A" | "PLAN_B" | "PLAN_C";

const plans = [
  {
    id: "PLAN_A" as PlanId,
    title: "Nearest courier",
    subtitle: "Reassign to V103",
    cost: "₹350",
    delay: "+12 min",
    saved: "14",
    score: 86,
    accent: "blue",
  },
  {
    id: "PLAN_B" as PlanId,
    title: "Split across couriers",
    subtitle: "V103 + V107",
    cost: "₹480",
    delay: "+8 min",
    saved: "18",
    score: 94,
    accent: "violet",
  },
  {
    id: "PLAN_C" as PlanId,
    title: "Delay + notify",
    subtitle: "Auto-notify customers",
    cost: "₹0",
    delay: "+55 min",
    saved: "5",
    score: 61,
    accent: "amber",
  },
];

const orders = [
  {
    id: "ORD-1042",
    customer: "Ananya Rao",
    area: "Jubilee Hills",
    eta: "14:51",
    sla: "15:00",
    value: "₹2,499",
    payment: "COD",
    risk: "CRITICAL",
    vip: true,
  },
  {
    id: "ORD-1047",
    customer: "Rahul Mehta",
    area: "Film Nagar",
    eta: "15:04",
    sla: "15:10",
    value: "₹1,299",
    payment: "PREPAID",
    risk: "HIGH",
    vip: false,
  },
  {
    id: "ORD-1051",
    customer: "Priya Shah",
    area: "Banjara Hills",
    eta: "15:12",
    sla: "15:20",
    value: "₹3,199",
    payment: "COD",
    risk: "HIGH",
    vip: true,
  },
  {
    id: "ORD-1058",
    customer: "Arjun Kumar",
    area: "Madhapur",
    eta: "15:24",
    sla: "15:30",
    value: "₹899",
    payment: "PREPAID",
    risk: "WATCH",
    vip: false,
  },
];

function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    truck: (
      <svg {...common}>
        <path d="M3 6h11v10H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
    package: (
      <svg {...common}>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4 7.5 12 12l8-4.5M12 12v9" />
      </svg>
    ),
    activity: (
      <svg {...common}>
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </svg>
    ),
    chart: (
      <svg {...common}>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 4-5 3 3 5-7" />
      </svg>
    ),
    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    ),
    bell: (
      <svg {...common}>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    ),
    chevron: (
      <svg {...common}>
        <path d="m8 10 4 4 4-4" />
      </svg>
    ),
    arrow: (
      <svg {...common}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),
    zap: (
      <svg {...common}>
        <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    ),
    clock: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    map: (
      <svg {...common}>
        <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
    ),
  };

  return icons[name] ?? null;
}

function Stat({
  label,
  value,
  detail,
  icon,
  danger,
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-wide text-slate-500">
          {label}
        </span>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger
              ? "bg-red-50 text-red-500"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          <Icon name={icon} size={19} />
        </div>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <span className="text-[30px] font-bold tracking-[-0.04em] text-slate-950">
          {value}
        </span>
        <span
          className={`mb-1 text-[13px] font-semibold ${
            danger ? "text-red-500" : "text-emerald-600"
          }`}
        >
          {detail}
        </span>
      </div>
    </div>
  );
}

function MapMarker({
  left,
  top,
  label,
  color = "blue",
}: {
  left: string;
  top: string;
  label: string;
  color?: "blue" | "red" | "green";
}) {
  const styles = {
    blue: "bg-blue-600 shadow-blue-300",
    red: "bg-red-500 shadow-red-300",
    green: "bg-emerald-500 shadow-emerald-300",
  };

  return (
    <div
      className="absolute z-20"
      style={{ left, top }}
    >
      <div className="flex items-center gap-2 rounded-full border border-white bg-white px-2.5 py-1.5 text-[12px] font-bold text-slate-800 shadow-[0_5px_18px_rgba(15,23,42,0.18)]">
        <span
          className={`h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px] ${styles[color]}`}
        />
        {label}
      </div>
      <div
        className={`mx-auto mt-[-2px] h-3 w-3 rotate-45 ${styles[color]}`}
      />
    </div>
  );
}

function RecoveryPlan({
  plan,
  selected,
  onSelect,
}: {
  plan: (typeof plans)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const accent =
    plan.accent === "violet"
      ? "violet"
      : plan.accent === "amber"
        ? "amber"
        : "blue";

  return (
    <button
      onClick={onSelect}
      className={`group relative w-full rounded-[22px] border p-5 text-left transition-all duration-200 ${
        selected
          ? "border-blue-500 bg-blue-50/60 shadow-[0_12px_35px_rgba(37,99,235,0.13)]"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]"
      }`}
    >
      {selected && (
        <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
          <Icon name="check" size={15} />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            accent === "violet"
              ? "bg-violet-100 text-violet-600"
              : accent === "amber"
                ? "bg-amber-100 text-amber-600"
                : "bg-blue-100 text-blue-600"
          }`}
        >
          <Icon name="truck" size={22} />
        </div>

        <div className="min-w-0">
          <div className="pr-8 text-[17px] font-bold text-slate-950">
            {plan.title}
          </div>
          <div className="mt-1 text-[13px] font-medium text-slate-500">
            {plan.subtitle}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="text-[11px] font-semibold text-slate-400">COST</div>
          <div className="mt-1 text-[15px] font-bold text-slate-900">
            {plan.cost}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="text-[11px] font-semibold text-slate-400">DELAY</div>
          <div className="mt-1 text-[15px] font-bold text-slate-900">
            {plan.delay}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="text-[11px] font-semibold text-slate-400">SLA SAVED</div>
          <div className="mt-1 text-[15px] font-bold text-emerald-600">
            {plan.saved}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Page() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("PLAN_B");
  const [approved, setApproved] = useState(false);
  const [seconds, setSeconds] = useState(15);
  const [impactData, setImpactData] = useState<any>(null);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [executionData, setExecutionData] = useState<any>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((value) => (value >= 59 ? 0 : value + 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadBackendData() {
      try {
        setBackendError(null);

        const [impact, recovery, evaluation] = await Promise.all([
          getImpact("D001"),
          getRecoveryPlans("D001"),
          evaluateRecovery("D001"),
        ]);

        setImpactData(impact);
        setRecoveryData(recovery);
        setEvaluationData(evaluation);

        console.log("RouteGuard backend data:", {
          impact,
          recovery,
          evaluation,
        });
      } catch (error) {
        console.error("Backend connection failed:", error);
        setBackendError("Backend connection failed");
      }
    }

    loadBackendData();
  }, []);


  const selected = plans.find((plan) => plan.id === selectedPlan)!;
  const recommendedPlan = evaluationData?.plans?.find(
  (plan: any) => plan.plan_id === evaluationData?.recommended_plan
);
const displayPlans = recoveryData?.recovery_plans?.map((plan: any) => {
  const planInfo = plans.find((p) => p.id === plan.plan_id);

  return {
    id: plan.plan_id as PlanId,
    title: planInfo?.title ?? plan.plan_type,
    subtitle: plan.description,
    cost: `₹${Number(plan.cost).toLocaleString("en-IN")}`,
    delay: `+${plan.delay_minutes} min`,
    saved: String(plan.sla_saved),
    score: Number(plan.evaluator_score ?? 0),
    accent: planInfo?.accent ?? "blue",
  };
}) ?? plans;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-[1720px] items-center gap-8 px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-blue-600 text-xl font-black text-white shadow-[0_7px_20px_rgba(37,99,235,0.25)]">
              R
            </div>

            <div>
              <div className="text-[18px] font-extrabold tracking-[-0.02em] text-slate-950">
                RouteGuard
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Autonomous Recovery
              </div>
            </div>
          </div>

          <nav className="ml-8 flex h-full items-center gap-1">
            {[
              ["Control Tower", "grid"],
              ["Orders", "package"],
              ["Fleet", "truck"],
              ["Performance", "chart"],
            ].map(([label, icon], index) => (
              <button
                key={label}
                className={`flex h-11 items-center gap-2 rounded-xl px-5 text-[13px] font-bold transition ${
                  index === 0
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon name={icon} size={17} />
                {label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right lg:block">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Hyderabad
              </div>
              <div className="mt-0.5 text-[13px] font-bold text-slate-700">
                14:32:{String(seconds).padStart(2, "0")}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                Simulation
              </span>
            </div>

            <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <Icon name="bell" size={19} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-[12px] font-extrabold text-blue-700">
              OP
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1720px] px-7 pb-12 pt-8">
        {/* INCIDENT STRIP */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white">
              <Icon name="zap" size={16} />
            </span>

            <div>
              <div className="text-[13px] font-extrabold text-red-800">
                ACTIVE DISRUPTION · D001
              </div>
              <div className="text-[12px] font-medium text-red-600">
                Vehicle V102 stopped moving in Jubilee Hills
              </div>
            </div>
          </div>

          <div className="hidden text-[12px] font-semibold text-red-600 md:block">
            Detected 14:32:04 · 20 orders in impact radius
          </div>
        </div>

        {/* HERO */}
        <section className="mb-7 grid grid-cols-[1fr_440px] gap-6">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-8 py-7 shadow-[0_12px_40px_rgba(15,23,42,0.055)]">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-100/60 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-32 w-72 rounded-full bg-violet-100/50 blur-3xl" />

            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-[12px] font-extrabold uppercase tracking-[0.15em] text-red-500">
                  Recovery in progress
                </span>
              </div>

              <h1 className="max-w-[850px] text-[38px] font-extrabold leading-[1.12] tracking-[-0.045em] text-slate-950">
                V102 broke down.
                <br />
                <span className="text-blue-600">
                  RouteGuard is recovering it.
                </span>
              </h1>

              <p className="mt-4 max-w-[720px] text-[16px] leading-7 text-slate-500">
                Breakdown detected in Jubilee Hills. RouteGuard mapped the
                affected deliveries, calculated SLA exposure, and generated
                recovery options automatically.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="rounded-xl bg-slate-100 px-4 py-2.5">
                  <span className="text-[12px] font-semibold text-slate-500">
                    Impacted
                  </span>
                  <span className="ml-2 text-[15px] font-extrabold text-slate-900">
                    {impactData ? `${impactData.affected_orders} orders` : "20 orders"}
                  </span>
                </div>

                <div className="rounded-xl bg-red-50 px-4 py-2.5">
                  <span className="text-[12px] font-semibold text-red-500">
                    SLA risk
                  </span>
                  <span className="ml-2 text-[15px] font-extrabold text-red-700">
                    {impactData
  ? `${impactData.sla_risk.critical} orders`
  : "6 orders"}
                  </span>
                </div>

                <div className="rounded-xl bg-amber-50 px-4 py-2.5">
                  <span className="text-[12px] font-semibold text-amber-600">
                    COD exposure
                  </span>
                  <span className="ml-2 text-[15px] font-extrabold text-amber-800">
                    {impactData
  ? `₹${Number(impactData.cod_exposure).toLocaleString("en-IN")}`
  : "₹18,500"}
                  </span>
                </div>

                <div className="rounded-xl bg-violet-50 px-4 py-2.5">
                  <span className="text-[12px] font-semibold text-violet-600">
                    VIP
                  </span>
                  <span className="ml-2 text-[15px] font-extrabold text-violet-800">
                    {impactData
  ? `${impactData.vip_customers} customers`
  : "3 customers"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI DECISION */}
          <div className="relative overflow-hidden rounded-[28px] border border-blue-200 bg-gradient-to-br from-[#eef5ff] via-white to-[#f7f2ff] p-7 shadow-[0_12px_40px_rgba(37,99,235,0.08)]">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Icon name="zap" size={17} />
                  </div>

                  <span className="text-[13px] font-extrabold uppercase tracking-[0.13em] text-blue-700">
                    AI recommendation
                  </span>
                </div>

                <div className="rounded-full bg-white px-3 py-1.5 text-[12px] font-extrabold text-blue-700 shadow-sm">
                  {recommendedPlan
  ? `${Number(recommendedPlan.evaluator_score).toFixed(2)} / 100`
  : "94 / 100"}
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[13px] font-semibold text-slate-500">
                  Recommended recovery
                </div>

                <div className="mt-1 text-[27px] font-extrabold tracking-[-0.03em] text-slate-950">
                  {evaluationData?.recommended_plan === "PLAN_A"
  ? "Nearest courier"
  : evaluationData?.recommended_plan === "PLAN_B"
    ? "Split across couriers"
    : "Delay + notify"}
                </div>

                <p className="mt-2 text-[13px] leading-5 text-slate-500">
                  Best balance of SLA protection, customer impact and recovery
                  cost.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white bg-white/80 p-3">
                  <div className="text-[10px] font-bold text-slate-400">
                    COST
                  </div>
                  <div className="mt-1 text-[17px] font-extrabold text-slate-950">
                    {recommendedPlan
  ? `₹${Number(recommendedPlan.cost).toLocaleString("en-IN")}`
  : "₹480"}
                  </div>
                </div>

                <div className="rounded-xl border border-white bg-white/80 p-3">
                  <div className="text-[10px] font-bold text-slate-400">
                    DELAY
                  </div>
                  <div className="mt-1 text-[17px] font-extrabold text-slate-950">
                    {recommendedPlan
  ? `+${recommendedPlan.delay_minutes} min`
  : "+8 min"}
                    
                  </div>
                </div>

                <div className="rounded-xl border border-white bg-white/80 p-3">
                  <div className="text-[10px] font-bold text-slate-400">
                    SLA SAVED
                  </div>
                  <div className="mt-1 text-[17px] font-extrabold text-emerald-600">
                    {recommendedPlan
  ? recommendedPlan.sla_saved
  : "18"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KPI ROW */}
        <section className="mb-7 grid grid-cols-4 gap-5">
          <Stat
            label="Orders affected"
            value="20"
            detail="+20 mapped"
            icon="package"
          />
          <Stat
            label="Critical SLA risk"
            value="6"
            detail="Needs attention"
            icon="clock"
            danger
          />
          <Stat
            label="COD exposure"
            value="₹18.5K"
            detail="3 VIP orders"
            icon="activity"
          />
          <Stat
            label="Recovery confidence"
            value="94%"
            detail="+8 min expected"
            icon="zap"
          />
        </section>

        {/* MAP + SIDE */}
        <section className="mb-7 grid grid-cols-[1.55fr_0.85fr] gap-6">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.055)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="text-[18px] font-extrabold text-slate-950">
                  Live delivery map
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Impact radius · courier positions · recovery routes
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-[12px] font-bold text-slate-600">
                  Live
                </span>
              </div>
            </div>

            <div className="relative h-[510px] overflow-hidden bg-[#e9eef1]">
              {/* MAP BASE */}
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  backgroundImage: `
                    linear-gradient(28deg, transparent 47%, #ffffff 48%, #ffffff 51%, transparent 52%),
                    linear-gradient(148deg, transparent 47%, #ffffff 48%, #ffffff 51%, transparent 52%),
                    linear-gradient(90deg, transparent 49%, #dce4e8 50%, transparent 51%),
                    linear-gradient(0deg, transparent 49%, #dce4e8 50%, transparent 51%)
                  `,
                  backgroundSize: "190px 160px, 240px 200px, 82px 82px, 82px 82px",
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-300/20" />

              {/* PARKS */}
              <div className="absolute left-[4%] top-[12%] h-[25%] w-[20%] rounded-[30%] bg-[#cfe8c7]/70" />
              <div className="absolute right-[7%] top-[7%] h-[18%] w-[17%] rounded-[45%] bg-[#cce8c4]/70" />
              <div className="absolute bottom-[9%] right-[14%] h-[20%] w-[21%] rounded-[35%] bg-[#cfe8c7]/65" />

              {/* MAIN ROADS */}
              <div className="absolute left-[-5%] top-[46%] h-[18px] w-[110%] rotate-[8deg] rounded-full bg-white shadow-[0_1px_2px_rgba(100,116,139,0.35)]" />
              <div className="absolute left-[37%] top-[-10%] h-[120%] w-[20px] rotate-[15deg] rounded-full bg-white shadow-[0_1px_2px_rgba(100,116,139,0.35)]" />
              <div className="absolute left-[-10%] top-[65%] h-[15px] w-[120%] rotate-[-13deg] rounded-full bg-white" />
              <div className="absolute left-[65%] top-[-10%] h-[120%] w-[17px] rotate-[-20deg] rounded-full bg-white" />

              {/* ROAD LABELS */}
              <div className="absolute left-[10%] top-[43%] rotate-[8deg] text-[12px] font-semibold text-slate-400">
                Jubilee Hills Road
              </div>
              <div className="absolute left-[72%] top-[35%] rotate-[-20deg] text-[12px] font-semibold text-slate-400">
                Road No. 36
              </div>
              <div className="absolute left-[16%] top-[74%] rotate-[-13deg] text-[12px] font-semibold text-slate-400">
                Banjara Hills Road
              </div>

              {/* SEARCH */}
              <div className="absolute left-5 top-5 z-30 flex w-[330px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_25px_rgba(15,23,42,0.13)]">
                <Icon name="search" size={18} />
                <span className="text-[13px] font-medium text-slate-400">
                  Search address, order or vehicle
                </span>
              </div>

              {/* MAP CONTROLS */}
              <div className="absolute right-5 top-5 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_25px_rgba(15,23,42,0.12)]">
                <button className="flex h-10 w-10 items-center justify-center border-b border-slate-100 text-lg text-slate-600">
                  +
                </button>
                <button className="flex h-10 w-10 items-center justify-center text-lg text-slate-600">
                  −
                </button>
              </div>

              {/* IMPACT RADIUS */}
              <div className="absolute left-[48%] top-[45%] h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-300/60 bg-red-100/20" />
              <div className="absolute left-[48%] top-[45%] h-[145px] w-[145px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-300/70 bg-red-100/25" />

              {/* ROUTES */}
              <svg className="absolute inset-0 z-10 h-full w-full">
                <path
                  d="M 49% 45% C 42% 38%, 32% 34%, 24% 27%"
                  stroke="#2563eb"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 49% 45% C 57% 51%, 67% 62%, 76% 70%"
                  stroke="#7c3aed"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 49% 45% C 40% 56%, 31% 65%, 20% 75%"
                  stroke="#94a3b8"
                  strokeWidth="4"
                  strokeDasharray="9 9"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              <MapMarker
                left="44%"
                top="39%"
                label="V102 · breakdown"
                color="red"
              />
              <MapMarker
                left="18%"
                top="21%"
                label="V103 · 4 min"
                color="blue"
              />
              <MapMarker
                left="70%"
                top="65%"
                label="V107 · 6 min"
                color="green"
              />

              {/* ORDER CLUSTERS */}
              <div className="absolute left-[26%] top-[29%] z-20 flex h-10 min-w-10 items-center justify-center rounded-full border-[4px] border-white bg-blue-600 px-3 text-[13px] font-extrabold text-white shadow-[0_5px_15px_rgba(37,99,235,0.35)]">
                7
              </div>

              <div className="absolute left-[59%] top-[56%] z-20 flex h-10 min-w-10 items-center justify-center rounded-full border-[4px] border-white bg-violet-600 px-3 text-[13px] font-extrabold text-white shadow-[0_5px_15px_rgba(124,58,237,0.35)]">
                8
              </div>

              <div className="absolute left-[34%] top-[69%] z-20 flex h-9 min-w-9 items-center justify-center rounded-full border-[4px] border-white bg-slate-600 px-2 text-[12px] font-extrabold text-white">
                5
              </div>

              {/* BOTTOM LEGEND */}
              <div className="absolute bottom-5 left-5 z-30 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_8px_25px_rgba(15,23,42,0.12)] backdrop-blur">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Breakdown
                </div>
                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  Recovery courier
                </div>
                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
                  Orders
                </div>
              </div>

              <div className="absolute bottom-5 right-5 z-30 rounded-xl bg-white/95 px-4 py-3 text-[11px] font-semibold text-slate-500 shadow-[0_8px_25px_rgba(15,23,42,0.12)]">
                Map updated 14:32:{String(seconds).padStart(2, "0")}
              </div>
            </div>
          </div>

          {/* DECISION PANEL */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.055)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[18px] font-extrabold text-slate-950">
                  Recovery decision
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Evaluator output
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-emerald-600">
                Ready
              </span>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-blue-600">
                  Top recommendation
                </span>
                <span className="text-[15px] font-extrabold text-blue-700">
                  {recommendedPlan
  ? `${Number(recommendedPlan.evaluator_score).toFixed(2)} / 100`
  : "94 / 100"}
                </span>
              </div>

              <div className="mt-3 text-[23px] font-extrabold tracking-[-0.03em] text-slate-950">
                Split across couriers
              </div>

              <p className="mt-2 text-[13px] leading-5 text-slate-500">
                Move critical orders to V103 and V107 to protect 18 SLAs while
                keeping additional delay to 8 minutes.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[13px] font-medium text-slate-500">
                  Recovery cost
                </span>
                <span className="text-[15px] font-extrabold text-slate-900">
                  ₹480
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[13px] font-medium text-slate-500">
                  Expected delay
                </span>
                <span className="text-[15px] font-extrabold text-slate-900">
                  +8 min
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[13px] font-medium text-slate-500">
                  SLA protected
                </span>
                <span className="text-[15px] font-extrabold text-emerald-600">
                  18 orders
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-500">
                  Customer impact
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-600">
                  LOW
                </span>
              </div>
            </div>

            <button
             onClick={async () => {
  try {
    if (!approved) {
      const result = await executeRecovery("D001", selectedPlan);

      setExecutionData(result);
      setApproved(true);
    }
  } catch (error) {
    console.error("Recovery execution failed:", error);
    setBackendError("Recovery execution failed");
  }
}}
              disabled={approved}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-extrabold transition ${
                approved
                  ? "cursor-default bg-emerald-100 text-emerald-700"
                  : "bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.25)] hover:bg-blue-700"
              }`}
            >
              <Icon name={approved ? "check" : "zap"} size={18} />
              {approved ? "Recovery authorized" : "Approve & execute"}
            </button>

            <div className="mt-3 text-center text-[11px] font-medium text-slate-400">
              {executionData
  ? `Recovery executed · ${executionData.orders_recovered} orders recovered`
  : "Human approval required before execution"}
            </div>
          </div>
        </section>

        {/* RECOVERY OPTIONS */}
        <section className="mb-7 rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,0.055)]">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="text-[20px] font-extrabold tracking-[-0.025em] text-slate-950">
                Recovery options
              </div>
              <div className="mt-1.5 text-[13px] text-slate-500">
                Generated by the Recovery Planner and ranked by the Evaluator
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-[12px] font-bold text-slate-500 md:flex">
              <Icon name="activity" size={16} />
              3 plans generated
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {displayPlans.map((plan) => (
              <RecoveryPlan
                key={plan.id}
                plan={plan}
                selected={selectedPlan === plan.id}
                onSelect={() => {
                  setSelectedPlan(plan.id);
                  setApproved(false);
                }}
              />
            ))}
          </div>
        </section>

        {/* AGENT PIPELINE */}
        <section className="mb-7 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.055)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
            <div>
              <div className="text-[19px] font-extrabold text-slate-950">
                Autonomous recovery pipeline
              </div>
              <div className="mt-1 text-[13px] text-slate-500">
                The system investigates the disruption before escalating the
                decision to an operator.
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Analysis complete
            </div>
          </div>

          <div className="grid grid-cols-4">
            {[
              {
                title: "Detection Agent",
                main: "Breakdown confirmed",
                sub: "GPS stall + courier event matched.",
                time: "14:32:04",
                color: "blue",
              },
              {
                title: "Impact Agent",
                main: impactData
  ? `${impactData.affected_orders} orders mapped`
  : "20 orders mapped",

sub: impactData
  ? `${impactData.sla_risk.critical} SLA risks · ${impactData.vip_customers} VIP · ₹${Number(impactData.cod_exposure).toLocaleString("en-IN")} COD.`
  : "6 SLA risks · 3 VIP · ₹18.5K COD.",
                time: "14:32:07",
                color: "violet",
              },
              {
                title: "Recovery Planner",
                main: recoveryData?.recovery_plans
  ? `${recoveryData.recovery_plans.length} plans generated`
  : "3 plans generated",

sub: "V103 + V105 have sufficient capacity.",
                time: "14:32:11",
                color: "amber",
              },
              {
                title: "Evaluator Agent",
               main: evaluationData?.recommended_plan === "PLAN_B"
  ? "Plan B selected"
  : evaluationData?.recommended_plan === "PLAN_A"
    ? "Plan A selected"
    : "Plan C selected",

sub: recommendedPlan
  ? `${Number(recommendedPlan.evaluator_score).toFixed(2)}/100 · strongest balance.`
  : "75.64/100 · strongest balance.",
                time: "14:32:14",
                color: "emerald",
              },
            ].map((agent, index) => (
              <div
                key={agent.title}
                className={`relative p-6 ${
                  index !== 3 ? "border-r border-slate-100" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        agent.color === "blue"
                          ? "bg-blue-100 text-blue-600"
                          : agent.color === "violet"
                            ? "bg-violet-100 text-violet-600"
                            : agent.color === "amber"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      <Icon name="check" size={16} />
                    </div>

                    <span className="text-[12px] font-extrabold uppercase tracking-[0.11em] text-slate-500">
                      {agent.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400">
                    {agent.time}
                  </span>
                </div>

                <div className="mt-5 text-[16px] font-extrabold text-slate-900">
                  {agent.main}
                </div>

                <div className="mt-1.5 text-[12px] leading-5 text-slate-400">
                  {agent.sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ORDERS + ACTIVITY */}
        <section className="grid grid-cols-[1.55fr_0.85fr] gap-6">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.055)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
              <div>
                <div className="text-[19px] font-extrabold text-slate-950">
                  Orders requiring attention
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Ranked by SLA risk and customer priority
                </div>
              </div>

              <button className="rounded-xl bg-slate-100 px-4 py-2.5 text-[12px] font-bold text-slate-600">
                Incident orders
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                    {[
                      "ORDER",
                      "CUSTOMER",
                      "ETA",
                      "SLA",
                      "VALUE",
                      "PAYMENT",
                      "RISK",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-4 text-[10px] font-extrabold tracking-[0.13em] text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-6 py-5">
                        <span className="text-[12px] font-extrabold text-slate-700">
                          {order.id}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="text-[13px] font-bold text-slate-800">
                          {order.customer}
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-slate-400">
                          {order.area}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-[13px] font-bold text-slate-700">
                        {order.eta}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`text-[13px] font-extrabold ${
                            order.risk === "CRITICAL"
                              ? "text-red-500"
                              : order.risk === "HIGH"
                                ? "text-amber-600"
                                : "text-slate-600"
                          }`}
                        >
                          {order.sla}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-[13px] font-extrabold text-slate-700">
                        {order.value}
                      </td>

                      <td className="px-6 py-5 text-[11px] font-bold text-slate-500">
                        {order.payment}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              order.risk === "CRITICAL"
                                ? "bg-red-500"
                                : order.risk === "HIGH"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                            }`}
                          />

                          <span className="text-[11px] font-extrabold text-slate-500">
                            {order.risk}
                          </span>

                          {order.vip && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold text-amber-600">
                              VIP
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-7 py-4">
              <button className="text-[12px] font-extrabold text-blue-600 hover:text-blue-700">
                View all 20 affected orders →
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.055)]">
            <div className="border-b border-slate-100 px-7 py-5">
              <div className="text-[19px] font-extrabold text-slate-950">
                Incident activity
              </div>
              <div className="mt-1 text-[13px] text-slate-500">
                Live system and operator events
              </div>
            </div>

            <div className="p-7">
              {[
                {
                  title: `Evaluator ranked ${selectedPlan === "PLAN_B" ? "Plan B" : selectedPlan === "PLAN_A" ? "Plan A" : "Plan C"} #1`,
                  text: `${selected.score}/100 · SLA protection`,
                  time: "14:32:14",
                  color: "blue",
                },
                {
                  title: "3 recovery plans generated",
                  text: "Nearest courier · Split · Delay",
                  time: "14:32:11",
                  color: "emerald",
                },
                {
                  title: "Impact analysis completed",
                  text: "20 orders · 6 critical · ₹18.5K COD",
                  time: "14:32:07",
                  color: "emerald",
                },
                {
                  title: "Vehicle V102 breakdown detected",
                  text: "GPS stationary + courier signal",
                  time: "14:32:04",
                  color: "red",
                },
                {
                  title: "Last successful GPS ping",
                  text: "Jubilee Hills · heading east",
                  time: "14:31:48",
                  color: "slate",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="relative flex gap-4 pb-7 last:pb-0"
                >
                  {index !== 4 && (
                    <div className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />
                  )}

                  <div
                    className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${
                      item.color === "blue"
                        ? "bg-blue-600"
                        : item.color === "emerald"
                          ? "bg-emerald-500"
                          : item.color === "red"
                            ? "bg-red-500"
                            : "bg-slate-300"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[12px] font-extrabold leading-5 text-slate-700">
                        {item.title}
                      </div>
                      <div className="shrink-0 text-[10px] font-bold text-slate-400">
                        {item.time}
                      </div>
                    </div>

                    <div className="mt-1 text-[11px] leading-5 text-slate-400">
                      {item.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EXECUTION BAR */}
        <section className="mt-7 flex items-center justify-between rounded-[22px] border border-blue-200 bg-gradient-to-r from-blue-50 to-violet-50 px-6 py-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                approved
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <Icon name={approved ? "check" : "zap"} size={21} />
            </div>

            <div>
              <div className="text-[14px] font-extrabold text-slate-900">
                {executionData ? "Recovery executed successfully" : "Human approval required"}
              </div>
              <div className="mt-1 text-[12px] text-slate-500">
                {approved
                  ? `${selected.title} has been sent to the recovery execution queue.`
                  : `RouteGuard recommends ${selected.title} for this incident.`}
              </div>
            </div>
          </div>

          <button
            onClick={() => setApproved(true)}
            disabled={approved}
            className={`rounded-xl px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.1em] ${
              approved
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.2)]"
            }`}
          >
            {approved ? "Execution queued ✓" : "Authorize recovery"}
          </button>
        </section>

        <footer className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          RouteGuard AI · Control Tower · Synthetic simulation environment
        </footer>
      </div>
    </main>
  );
}