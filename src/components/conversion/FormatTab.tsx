import { CopyButton } from "@/components/shared/CopyButton";

interface FormatTabProps {
  label: string;
  content: string | null;
}

export function FormatTab({ label, content }: FormatTabProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs text-text-muted">{label}</span>
        <CopyButton text={content} />
      </div>
      <textarea
        readOnly
        value={content ?? ""}
        placeholder={content === null ? "Conversion not available" : "No geometry loaded"}
        className="flex-1 resize-none bg-transparent px-3 py-2 font-mono text-xs leading-relaxed text-text-primary placeholder-text-muted/50 focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
