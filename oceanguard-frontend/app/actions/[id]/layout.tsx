export const dynamicParams = true;

export async function generateStaticParams() {
  // Return empty array - this page will be rendered client-side only
  return [];
}

export default function ActionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

