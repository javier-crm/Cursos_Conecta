import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Exporta todas las órdenes a CSV (para contabilidad y pagos a instructores).
export async function GET() {
  await requireRole(["admin"], "/admin");
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select(
      "created_at, paid_at, status, amount_cents, currency, payment_method, course:courses(title, instructor:instructors(display_name, commission_pct)), user_id",
    )
    .order("created_at", { ascending: false });

  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["fecha", "pagado_el", "estado", "curso", "instructor", "comision_pct", "parte_instructor_mxn", "monto_mxn", "metodo", "usuario_id"],
    ...(orders ?? []).map((order) => {
      const course = Array.isArray(order.course) ? order.course[0] : order.course;
      const instructor = course && (Array.isArray(course.instructor) ? course.instructor[0] : course.instructor);
      const share =
        order.status === "paid" && instructor
          ? ((order.amount_cents * Number(instructor.commission_pct)) / 10000).toFixed(2)
          : "";
      return [
        order.created_at,
        order.paid_at ?? "",
        order.status,
        course?.title ?? "",
        instructor?.display_name ?? "",
        instructor?.commission_pct ?? "",
        share,
        (order.amount_cents / 100).toFixed(2),
        order.payment_method ?? "",
        order.user_id,
      ];
    }),
  ];

  const csv = "﻿" + rows.map((row) => row.map(esc).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ventas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
