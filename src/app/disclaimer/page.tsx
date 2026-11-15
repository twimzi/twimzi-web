import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Platform Disclaimer | Twimzi",
  description: "Read the Twimzi platform disclaimer covering business listings, third-party information, user-generated content and website use."
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="disclaimer"
      title="Platform Disclaimer"
    />
  );
}