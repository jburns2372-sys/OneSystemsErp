import React from "react";
import { fetchActiveTemplates } from "@/app/actions/documentTemplateActions";
import TemplateUploadClient from "./TemplateUploadClient";

export default async function ProgressBillingTemplatesPage() {
  const result = await fetchActiveTemplates();
  const templates = result.success ? result.data : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Billing & Certificate Templates</h1>
        <p className="text-gray-500">Manage the official templates used for generating Progress Billings and Certificates of Payment.</p>
      </div>

      <TemplateUploadClient initialTemplates={templates as any} />
    </div>
  );
}
