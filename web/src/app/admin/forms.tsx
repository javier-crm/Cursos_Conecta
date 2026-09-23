"use client";

import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { saveCoupon, saveCourse, saveInstructor, type CrudState } from "./crud-actions";

function Feedback({ state }: { state: CrudState }) {
  if (state?.error) return <Alert kind="error">{state.error}</Alert>;
  if (state?.message) return <Alert kind="success">{state.message}</Alert>;
  return null;
}

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

/* ---------- Instructor ---------- */

export type InstructorFormData = {
  id?: string;
  display_name?: string;
  topic?: string | null;
  bio?: string | null;
  commission_pct?: number;
  active?: boolean;
};

export function InstructorForm({ instructor }: { instructor?: InstructorFormData }) {
  const [state, action] = useActionState(saveInstructor, undefined);
  return (
    <form action={action} className="space-y-4">
      {instructor?.id && <input type="hidden" name="id" value={instructor.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" name="display_name" defaultValue={instructor?.display_name} required />
        <Field label="Tema / especialidad" name="topic" defaultValue={instructor?.topic ?? ""} />
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Bio (se muestra en la página del curso)</span>
        <textarea name="bio" rows={3} defaultValue={instructor?.bio ?? ""} className={selectClass} />
      </label>
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <Field
          label="Comisión del instructor (%)"
          name="commission_pct"
          type="number"
          min={0}
          max={100}
          step="0.5"
          defaultValue={instructor?.commission_pct ?? 70}
          required
        />
        <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-700">
          <input type="checkbox" name="active" defaultChecked={instructor?.active ?? true} /> Activo (visible en el sitio)
        </label>
      </div>
      <Feedback state={state} />
      <SubmitButton pendingText="Guardando…">Guardar instructor</SubmitButton>
    </form>
  );
}

/* ---------- Curso ---------- */

export type CourseFormData = {
  id?: string;
  instructor_id?: string;
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  price_cents?: number;
  capacity?: number | null;
  replay_hours?: number;
  permanent_replay_price_cents?: number | null;
  sales_close_at?: string | null;
  status?: string;
  sessions?: { position: number; title: string | null; starts_at: string; duration_minutes: number }[];
};

// Convierte un timestamp a "YYYY-MM-DDTHH:mm" en hora de Monterrey (UTC-6)
function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(new Date(value).getTime() - 6 * 3600_000);
  return date.toISOString().slice(0, 16);
}

export function CourseForm({
  course,
  instructors,
}: {
  course?: CourseFormData;
  instructors: { id: string; display_name: string }[];
}) {
  const [state, action] = useActionState(saveCourse, undefined);
  const sessions = course?.sessions ?? [];
  return (
    <form action={action} className="space-y-5">
      {course?.id && <input type="hidden" name="id" value={course.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Instructor</span>
          <select name="instructor_id" defaultValue={course?.instructor_id} className={selectClass} required>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>{i.display_name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Estado</span>
          <select name="status" defaultValue={course?.status ?? "draft"} className={selectClass}>
            <option value="draft">Borrador (oculto)</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </label>
      </div>

      <Field label="Título" name="title" defaultValue={course?.title} required />
      <Field label="Subtítulo (frase de venta)" name="subtitle" defaultValue={course?.subtitle ?? ""} />
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Descripción</span>
        <textarea name="description" rows={4} defaultValue={course?.description ?? ""} className={selectClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Precio (MXN)"
          name="price"
          type="number"
          min={1}
          step="1"
          defaultValue={course ? (course.price_cents ?? 0) / 100 : ""}
          required
        />
        <Field label="Cupo (vacío = sin límite)" name="capacity" type="number" min={1} defaultValue={course?.capacity ?? ""} />
        <Field
          label="Grabación disponible (horas)"
          name="replay_hours"
          type="number"
          min={0}
          defaultValue={course?.replay_hours ?? 72}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Precio acceso permanente a grabaciones (MXN, vacío = no se vende)"
          name="permanent_replay_price"
          type="number"
          min={0}
          defaultValue={course?.permanent_replay_price_cents ? course.permanent_replay_price_cents / 100 : ""}
        />
        <Field
          label="Cierre de ventas (hora MTY)"
          name="sales_close_at"
          type="datetime-local"
          defaultValue={toLocalInput(course?.sales_close_at)}
        />
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Sesiones en vivo (deja la fecha vacía para quitar una)</legend>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((position) => {
            const session = sessions.find((s) => s.position === position);
            return (
              <div key={position} className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
                <Field label={`Sesión ${position} · título`} name={`session_${position}_title`} defaultValue={session?.title ?? ""} />
                <Field
                  label="Fecha y hora (MTY)"
                  name={`session_${position}_at`}
                  type="datetime-local"
                  defaultValue={toLocalInput(session?.starts_at)}
                />
                <Field
                  label="Minutos"
                  name={`session_${position}_duration`}
                  type="number"
                  min={15}
                  step={15}
                  defaultValue={session?.duration_minutes ?? 60}
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      <Feedback state={state} />
      <SubmitButton pendingText="Guardando…">Guardar curso</SubmitButton>
    </form>
  );
}

/* ---------- Cupón ---------- */

export function CouponForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [state, action] = useActionState(saveCoupon, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Código" name="code" placeholder="LANZAMIENTO20" required />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Tipo</span>
          <select name="type" className={selectClass}>
            <option value="percent">% de descuento</option>
            <option value="amount">Monto fijo (MXN)</option>
          </select>
        </label>
        <Field label="Valor" name="value" type="number" min={1} step="1" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Curso (vacío = todos)</span>
          <select name="course_id" className={selectClass}>
            <option value="">Todos los cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>
        <Field label="Usos máximos (vacío = sin límite)" name="max_redemptions" type="number" min={1} />
        <Field label="Expira (hora MTY)" name="expires_at" type="datetime-local" />
      </div>
      <Feedback state={state} />
      <SubmitButton pendingText="Creando…">Crear cupón</SubmitButton>
    </form>
  );
}
