/** Shown the instant the section is opened, while its numbers are being read. */
export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      <div className="skeleton h-[42px] max-w-xl" />
      <div className="skeleton h-[104px]" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="skeleton h-[76px]" />
        ))}
      </div>
      <div className="skeleton h-[420px]" />
    </div>
  );
}
