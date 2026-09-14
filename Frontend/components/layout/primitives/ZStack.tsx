export default function ZStack({ children }: { children: React.ReactNode }) {
  return <div className="relative w-full">{children}</div>;
}