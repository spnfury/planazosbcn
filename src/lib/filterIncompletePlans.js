import { supabase } from "@/lib/supabase";

// Un plan se considera "incompleto" si tiene tickets registrados en plan_tickets
// pero ninguno tiene nombre y precio válidos. Esos planes no deben aparecer en listados
// ni en el detalle público (ver src/app/planes/[slug]/page.js).
//
// Devuelve el array de planes sin los incompletos.
export async function filterIncompletePlans(plans) {
  if (!Array.isArray(plans) || plans.length === 0) return plans || [];

  const planIds = plans.map((p) => p.id).filter(Boolean);
  if (planIds.length === 0) return plans;

  const { data: tickets, error } = await supabase
    .from("plan_tickets")
    .select("plan_id, name, price")
    .in("plan_id", planIds);

  if (error) {
    console.error("Error fetching tickets for incomplete-plan filter:", error);
    return plans;
  }

  const ticketsByPlan = new Map();
  for (const t of tickets || []) {
    if (!ticketsByPlan.has(t.plan_id)) ticketsByPlan.set(t.plan_id, []);
    ticketsByPlan.get(t.plan_id).push(t);
  }

  const isValidTicket = (t) =>
    t.name &&
    String(t.name).trim() !== "" &&
    t.price !== null &&
    t.price !== undefined &&
    t.price !== "";

  return plans.filter((plan) => {
    const planTickets = ticketsByPlan.get(plan.id);
    if (!planTickets || planTickets.length === 0) return true; // sin tickets → ok
    return planTickets.some(isValidTicket);
  });
}
