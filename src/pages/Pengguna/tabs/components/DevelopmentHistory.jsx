const EMPTY={tahun:"",berat_badan:0,tinggi_badan:0,penyakit:"",kelainan_jiwa:""};
const normalize=value=>Array.from({length:3},(_,i)=>({...EMPTY,...value?.riwayat_perkembangan?.[i]}));
const number=v=>v===""?0:Number(v)||0;

const fields=[
  {key:"tahun",label:"Tahun",placeholder:"20xx"},
  {key:"berat_badan",label:"Berat Badan",unit:"kg",type:"number"},
  {key:"tinggi_badan",label:"Tinggi Badan",unit:"cm",type:"number"},
  {key:"penyakit",label:"Penyakit",area:true,placeholder:"-"},
  {key:"kelainan_jiwa",label:"Kelainan",area:true,placeholder:"-"},
];

function Input({field,value,onChange,label}){
  const base="w-full rounded-lg border border-slate-200 bg-slate-50 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#ef4d45] focus:bg-white focus:ring-2 focus:ring-red-50";

  if(field.area)return <textarea
    rows={2}
    aria-label={label}
    value={value||""}
    placeholder={field.placeholder}
    onChange={e=>onChange(e.target.value)}
    className={`${base} min-h-16 resize-none px-3 py-2 leading-5 md:text-center`}
  />;

  return <div className="relative">
    <input
      type={field.type||"text"}
      min={field.type==="number"?0:undefined}
      step={field.type==="number"?"0.1":undefined}
      inputMode={field.key==="tahun"?"numeric":undefined}
      maxLength={field.key==="tahun"?4:undefined}
      aria-label={label}
      value={value||""}
      placeholder={field.placeholder||"0"}
      onChange={e=>onChange(
        field.key==="tahun"
          ?e.target.value.replace(/\D/g,"").slice(0,4)
          :number(e.target.value)
      )}
      className={`${base} h-10 px-3 md:text-center ${field.unit?"pr-10":""}`}
    />
    {field.unit&&<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
      {field.unit}
    </span>}
  </div>;
}

export default function DevelopmentHistory({value,onChange}){
  const history=normalize(value);

  const set=(index,key,next)=>{
    const rows=normalize(value);
    rows[index]={...rows[index],[key]:next};
    onChange({...value,riwayat_perkembangan:rows});
  };

  return <section>
    <div className="flex items-center gap-3">
      <h3 className="shrink-0 text-[13px] font-bold uppercase tracking-wide text-slate-800">
        Keadaan Jasmani (Riwayat)
      </h3>
      <div className="h-px flex-1 bg-slate-200"/>
    </div>

    <p className="mt-3 text-[11px] leading-5 text-slate-400">
      *Isi data perkembangan jasmani anak selama 3 tahun.
    </p>

    <div className="mt-4 space-y-3 md:hidden">
      {history.map((row,index)=><article key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
              Tahun Ke-{index+1}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Riwayat keadaan jasmani
            </p>
          </div>

          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-500 shadow-sm">
            {index+1}
          </span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {fields.map(field=><div key={field.key} className={field.area?"sm:col-span-2":""}>
            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              {field.label}{field.unit?` (${field.unit})`:""}
            </label>
            <Input
              field={field}
              value={row[field.key]}
              label={`${field.label} Tahun Ke-${index+1}`}
              onChange={next=>set(index,field.key,next)}
            />
          </div>)}
        </div>
      </article>)}
    </div>

    <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-200 md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-[26%] px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Aspek
              </th>
              {[1,2,3].map(year=><th key={year} className="px-3 py-3.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Tahun Ke-{year}
              </th>)}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {fields.map((field,rowIndex)=><tr key={field.key}>
              <td className="px-5 py-3 text-[12px] font-semibold text-slate-700">
                {String.fromCharCode(97+rowIndex)}. {field.label}{field.unit?` (${field.unit})`:""}
              </td>

              {history.map((row,index)=><td key={index} className="px-3 py-2.5">
                <Input
                  field={field}
                  value={row[field.key]}
                  label={`${field.label} Tahun Ke-${index+1}`}
                  onChange={next=>set(index,field.key,next)}
                />
              </td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </section>;
}