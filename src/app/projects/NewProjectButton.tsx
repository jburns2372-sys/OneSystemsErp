'use client';

import ProjectStartButton from './ProjectStartButton';

/**
 * Legacy `NewProjectButton` (BOQ-first creation via `mutations.ts:createProject`) is retired.
 * All project creation routes through `ProjectStartButton` -> `createProjectProfile`
 * (project-first intake + atomic signed-RLS creator assignment).
 */
export default function NewProjectButton(_props: { users?: { id: string; name: string }[] }) {
  return <ProjectStartButton />;
}
