import {useEffect,useMemo,useState} from "react";
import {
  AcademicCapIcon,BanknotesIcon,BriefcaseIcon,CalendarDaysIcon,
  EnvelopeIcon,IdentificationIcon,MapPinIcon,PencilSquareIcon,
  PhoneIcon,PhotoIcon,UserIcon,XMarkIcon,
} from "@heroicons/react/24/outline";
import {normalizeStaffForm} from "./StaffForm";

const text=v=>String(v??"").trim();
const show=v=>text(v)||"-";

const formatDate=v=>{
  if(!v)return"-";
  const d=new Date(`${String(v).slice(0,10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ?String(v)
    :new Intl.DateTimeFormat("id-ID",{
      day:"2-digit",
      month:"long",
      year:"numeric",
    }).format(d);
};

const formatMoney=v=>new Intl.NumberFormat("id-ID",{
  style:"currency",
  currency:"IDR",
  maximumFractionDigits:0,
}).format(Number(v)||0);

function Photo({src,name,className=""}){
  const [failed,setFailed]=useState(false);

  useEffect(()=>setFailed(false),[src]);

  return <div className={`overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${className}`}>
    {text(src)&&!failed
      ?<img
        src={src}
        alt={`Foto ${name||"staff"}`}
        onError={()=>setFailed(true)}
        className="h-full w-full object-cover object-center"
      />
      :<div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
          <PhotoIcon className="h-5 w-5"/>
        </span>
        <span className="mt-2 text-[9px] font-medium text-slate-400">
          Belum ada foto
        </span>
      </div>}
  </div>;
}

function Section({icon:Icon,title,description,children}){
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <header className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-100">
        <Icon className="h-4 w-4"/>
      </span>

      <div className="min-w-0">
        <h3 className="text-[11px] font-semibold text-slate-700">
          {title}
        </h3>

        {description&&<p className="mt-0.5 text-[9px] leading-4 text-slate-400">
          {description}
        </p>}
      </div>
    </header>

    <div className="p-4 sm:p-5">
      {children}
    </div>
  </section>;
}

function Item({label,value,className=""}){
  return <div className={`min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3 ${className}`}>
    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
      {label}
    </p>

    <p className="mt-1.5 wrap-break-word text-[12px] font-semibold leading-5 text-slate-700">
      {show(value)}
    </p>
  </div>;
}

function ContactItem({icon:Icon,label,value}){
  return <div className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-100">
      <Icon className="h-4 w-4"/>
    </span>

    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 wrap-break-word text-[12px] font-semibold leading-5 text-slate-700">
        {show(value)}
      </p>
    </div>
  </div>;
}

export default function StaffDetailModal({staff,onClose,onEdit}){
  const data=useMemo(
    ()=>staff?normalizeStaffForm(staff):null,
    [staff]
  );

  useEffect(()=>{
    if(!data)return;

    const old=document.body.style.overflow;
    const key=e=>e.key==="Escape"&&onClose?.();

    document.body.style.overflow="hidden";
    window.addEventListener("keydown",key);

    return()=>{
      document.body.style.overflow=old;
      window.removeEventListener("keydown",key);
    };
  },[data,onClose]);

  if(!data)return null;

  return <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="staff-detail-title"
    onMouseDown={e=>e.target===e.currentTarget&&onClose?.()}
    className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4"
  >
    <section className="flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-slate-50 shadow-2xl sm:max-h-[92dvh] sm:max-w-4xl sm:rounded-2xl">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5">
          <Photo
            src={data.foto}
            name={data.nama_lengkap}
            className="h-24 w-[72px] shrink-0 sm:h-28 sm:w-[84px]"
          />

          <div className="min-w-0 flex-1 py-0.5">
            <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-slate-400">
              Detail staf
            </p>

            <h2
              id="staff-detail-title"
              className="mt-1 truncate text-base font-semibold text-slate-900 sm:text-lg"
            >
              {show(data.nama_lengkap)}
            </h2>

            <p className="mt-1 truncate text-[10px] text-slate-400">
              NIK {show(data.nik)}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex max-w-full truncate rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-semibold text-indigo-600">
                {show(data.jabatan)}
              </span>

              <span className="inline-flex max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-500">
                {show(data.pendidikan_terakhir)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5"/>
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-5">
          <Section
            icon={IdentificationIcon}
            title="Identitas Pribadi"
            description="Informasi identitas resmi staf."
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Item
                label="Nama Lengkap"
                value={data.nama_lengkap}
                className="sm:col-span-2"
              />

              <Item
                label="NIK"
                value={data.nik}
              />

              <Item
                label="NIP"
                value={data.nip}
              />

              <Item
                label="Tempat Lahir"
                value={data.tempat_lahir}
              />

              <Item
                label="Tanggal Lahir"
                value={formatDate(data.tanggal_lahir)}
              />

              <Item
                label="Jenis Kelamin"
                value={data.jenis_kelamin}
              />

              <Item
                label="Agama"
                value={data.agama}
              />

              <Item
                label="Status Pernikahan"
                value={data.status_pernikahan}
              />
            </div>
          </Section>

          <Section
            icon={AcademicCapIcon}
            title="Pendidikan"
            description="Informasi pendidikan terakhir staf."
          >
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                <AcademicCapIcon className="h-5 w-5"/>
              </span>

              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                  Pendidikan Terakhir
                </p>

                <p className="mt-1 text-[13px] font-semibold text-slate-700">
                  {show(data.pendidikan_terakhir)}
                </p>
              </div>
            </div>
          </Section>

          <Section
            icon={BriefcaseIcon}
            title="Kepegawaian"
            description="Informasi pekerjaan dan administrasi staf."
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Item
                label="Jabatan"
                value={data.jabatan}
              />

              <Item
                label="Tanggal Bergabung"
                value={formatDate(data.tanggal_bergabung)}
              />

              <Item
                label="Gaji Pokok"
                value={formatMoney(data.gaji_pokok)}
              />

              <Item
                label="NPWP"
                value={data.npwp}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                  <BriefcaseIcon className="h-4 w-4"/>
                </span>

                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Jabatan
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-700">
                    {show(data.jabatan)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                  <BanknotesIcon className="h-4 w-4"/>
                </span>

                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Gaji Pokok
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-700">
                    {formatMoney(data.gaji_pokok)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <CalendarDaysIcon className="h-4 w-4"/>
                </span>

                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Bergabung
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-700">
                    {formatDate(data.tanggal_bergabung)}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section
            icon={MapPinIcon}
            title="Kontak dan Alamat"
            description="Informasi kontak dan domisili staf."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <ContactItem
                icon={PhoneIcon}
                label="Nomor ponsel"
                value={data.no_hp}
              />

              <ContactItem
                icon={EnvelopeIcon}
                label="Email"
                value={data.email}
              />

              <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3 sm:col-span-2">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-100">
                    <MapPinIcon className="h-4 w-4"/>
                  </span>

                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                      Alamat Lengkap
                    </p>

                    <p className="mt-1 whitespace-pre-wrap wrap-break-word text-[12px] leading-5 text-slate-600">
                      {show(data.alamat_lengkap)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                <UserIcon className="h-4 w-4"/>
              </span>

              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Staff
                </p>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-700">
                  {show(data.nama_lengkap)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                <BriefcaseIcon className="h-4 w-4"/>
              </span>

              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Jabatan
                </p>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-700">
                  {show(data.jabatan)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <AcademicCapIcon className="h-4 w-4"/>
              </span>

              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Pendidikan
                </p>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-700">
                  {show(data.pendidikan_terakhir)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Tutup
          </button>

          {onEdit&&<button
            type="button"
            onClick={()=>{
              onClose?.();
              onEdit(data);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white transition hover:bg-[#df433c]"
          >
            <PencilSquareIcon className="h-4 w-4"/>
            Edit Data
          </button>}
        </div>
      </footer>
    </section>
  </div>;
}