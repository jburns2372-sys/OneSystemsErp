import { redirect } from 'next/navigation';

// The single-file legacy BOQ uploader is retired from the user-facing workflow.
// Use the project-first documents workspace and existing governed UBOQ intake.
// Keep legacy data/services untouched for historical compatibility and rollback.
export default function LegacyBoqTemplateRedirect() {
  redirect('/projects');
}
