import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'LEGACY_GATE7_IMPORT_DISABLED',
      message:
        'Legacy Gate 7 project reconstruction import is disabled because it bypassed atomic signed-RLS project creation. Create the project through createProjectProfile and import BOQ data via the governed BOQ intake pipeline.',
    },
    { status: 410 }
  );
}
