import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Privacy Policy | Twimzi",
  description: "Twimzi Privacy Policy.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      documentType="privacy_policy"
      title="Privacy Policy"
    />
  );
}