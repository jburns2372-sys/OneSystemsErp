import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AccomplishmentDataGrid from "@/components/AccomplishmentDataGrid";

export default async function ViewAccomplishmentFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileRecord = await prisma.projectAccomplishmentFile.findUnique({
    where: { id },
  });

  if (!fileRecord) return notFound();

  // Strip out any complex nested structures to pass to client component safely
  const safeFileRecord = JSON.parse(JSON.stringify(fileRecord));

  return (
    <div className="w-full h-[calc(100vh-2rem)] p-4">
      <AccomplishmentDataGrid fileRecord={safeFileRecord} />
    </div>
  );
}
