import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Acceptable Use Policy | Twimzi",
  description: "Learn the content, conduct and platform-use standards that help keep Twimzi safe, useful and trustworthy for businesses and visitors.",
};

export default function AcceptableUsePage() {
  return (
    <LegalDocumentPage
      documentType="acceptable_use_policy"
      title="Acceptable Use Policy"
    />
  );
}