import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Privacy Policy | Twimzi",
  description:
    "Read how Twimzi collects, uses, stores and protects personal information, and understand your choices and privacy rights.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      documentType="privacy_policy"
      title="Privacy Policy"
    />
  );
}