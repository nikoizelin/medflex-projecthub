export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          color-scheme: light !important;
        }
      `}</style>
      {children}
    </>
  );
}
