import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Grievance Redressal Policy | Twimzi",
  description: "Find how to raise a grievance with Twimzi, what details to include and how platform-related complaints are handled."
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="grievance_redressal_policy"
      title="Grievance Redressal Policy"
    />
  );
}