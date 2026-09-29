import { Section, Field } from "./Section";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, FileText } from "lucide-react";

interface DocumentsProps {
  documents?: {
    personalIdDocument?: { type: string; url: string };
    highSchoolCertificate?: { type: string; url: string };
    englishCertificate?: { type: string; url: string };
    paymentReceipt?: { type: string; url: string };
  };
}

export function DocumentsSection({ data }: { data: DocumentsProps }) {
  const documents = data.documents;

  if (!documents) return null;

  const renderDocumentLink = (
    doc?: { type: string; url: string } | string,
    label?: string,
  ) => {
    // Handle if doc is a string (URL directly)
    if (typeof doc === "string" && doc && doc !== "N/A") {
      return (
        <a
          href={doc}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black underline inline-flex items-center gap-1"
        >
          <FileText className="w-4 h-4" />
          <span>View Document</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }

    // Handle if doc is an object with type and url
    if (doc && typeof doc === "object" && doc.url) {
      return (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black underline inline-flex items-center gap-1"
        >
          <FileText className="w-4 h-4" />
          <span>{doc.type || label || "View Document"}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }

    return <span className="text-muted-foreground">Not Provided</span>;
  };

  return (
    <>
      <Section title="Documents" defaultOpen={false}>
        <Field
          label="ID / Birth Certificate"
          value={renderDocumentLink(
            documents.personalIdDocument,
            "Personal ID Document",
          )}
        />

        <Field
          label="High School Certificate"
          value={renderDocumentLink(
            documents.highSchoolCertificate,
            "High School Certificate",
          )}
        />

        <Field
          label="English Certificate"
          value={renderDocumentLink(
            documents.englishCertificate,
            "English Certificate",
          )}
        />

        <Field
          label="Payment Receipt"
          value={renderDocumentLink(
            documents.paymentReceipt,
            "Payment Receipt",
          )}
        />
      </Section>

      <Separator />
    </>
  );
}
