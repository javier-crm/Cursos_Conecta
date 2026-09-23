"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { notifyWaitlist, type CrudState } from "../../crud-actions";

export function WaitlistNotifyButton({ courseId }: { courseId: string }) {
  const [state, action] = useActionState<CrudState, FormData>(notifyWaitlist, undefined);
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="course_id" value={courseId} />
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.message && <Alert kind="success">{state.message}</Alert>}
      <button className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
        Avisar que hay lugar
      </button>
    </form>
  );
}
