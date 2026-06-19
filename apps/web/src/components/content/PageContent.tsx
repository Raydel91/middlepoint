type Props = {
  content: string;
};

export function PageContent({ content }: Props) {
  const blocks = content.split(/\n\n+/).filter((block) => block.trim().length > 0);

  if (blocks.length === 0) return null;

  return (
    <div className="prose prose-sm mt-8 max-w-none space-y-4 text-secondary/80">
      {blocks.map((block, index) => (
        <p key={index} className="whitespace-pre-line leading-relaxed">
          {block.trim()}
        </p>
      ))}
    </div>
  );
}
