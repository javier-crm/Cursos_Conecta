"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { createZoomMeetings, type AdminState } from "./actions";

export function ZoomButton({ courseId }: { courseId: string }) {
  const [state, action] = useActionState<AdminState, FormData>(createZoomMeetings, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="course_id" value={courseId} />
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.message && <Alert kind="success">{state.message}</Alert>}
      <button className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
        Crear reuniones de Zoom
      </button>
    </form>
  );
}
