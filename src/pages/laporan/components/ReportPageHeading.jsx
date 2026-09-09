export default function ReportPageHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex min-w-0 items-start gap-3.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-[#e94640]">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 pt-0.5">
        <h1 className="text-xl font-semibold leading-7 tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-xs font-normal leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
