import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar } from "lucide-react";

interface LegalDocumentViewerProps {
  documentPath: string;
  title: string;
  lastUpdated?: string;
}

export const LegalDocumentViewer = ({ 
  documentPath, 
  title, 
  lastUpdated = "December 5, 2024" 
}: LegalDocumentViewerProps) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(documentPath);
        if (!response.ok) throw new Error("Document not found");
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError("Unable to load document");
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
  }, [documentPath]);

  // Simple markdown to HTML converter
  const renderMarkdown = (md: string) => {
    let html = md
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2 text-foreground">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3 text-primary">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-primary">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr class="my-6 border-border" />')
      // Unordered lists
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1 text-muted-foreground">$1</li>')
      // Table rows (simple)
      .replace(/\| (.*?) \| (.*?) \|/g, '<div class="grid grid-cols-2 gap-4 py-2 border-b border-border"><span class="font-medium">$1</span><span class="text-muted-foreground">$2</span></div>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4 text-muted-foreground leading-relaxed">')
      // Line breaks
      .replace(/\n/g, '<br />');
    
    // Wrap lists
    html = html.replace(/(<li.*<\/li>)+/g, '<ul class="list-disc mb-4">$&</ul>');
    
    return `<p class="mb-4 text-muted-foreground leading-relaxed">${html}</p>`;
  };

  if (loading) {
    return (
      <Card className="p-6 md:p-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 md:p-8 max-w-4xl mx-auto text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="prose prose-sm max-w-none legal-content"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    </Card>
  );
};

export default LegalDocumentViewer;
