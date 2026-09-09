const text=value=>String(value??"").trim();
const generic=value=>/^(internal server error|server error|error|unknown error)$/i.test(text(value));
const detailOf=value=>{
  if(value===null||value===undefined)return "";
  if(typeof value==="string"||typeof value==="number"||typeof value==="boolean")return text(value);
  if(Array.isArray(value))return value.map(item=>detailOf(item?.msg??item?.message??item?.detail??item)).filter(Boolean).join(", ");
  if(typeof value==="object"){
    const direct=detailOf(value.detail??value.message??value.error??value.msg);
    if(direct)return direct;
    return Object.entries(value).map(([key,item])=>{const detail=detailOf(item);return detail?`${key}: ${detail}`:"";}).filter(Boolean).join(", ");
  }
  return "";
};

export function apiErrorMessage(error,{action="memproses",subject="data"}={}){
  const status=Number(error?.status??error?.response?.status??0)||0;
  const body=error?.body??error?.response?.data??error?.data;
  const detail=detailOf(body)||detailOf(error?.detail)||text(error?.message);
  if(detail&&!generic(detail)&&!(status>=500&&/^request failed/i.test(detail)))return detail;
  if(status===400)return `Permintaan ${subject} tidak dapat diproses. Periksa data yang dikirim lalu coba lagi.`;
  if(status===401)return "Sesi login sudah tidak valid. Silakan masuk kembali.";
  if(status===403)return `Akun Anda tidak memiliki izin untuk ${action} ${subject}.`;
  if(status===404)return `${subject.charAt(0).toUpperCase()+subject.slice(1)} tidak ditemukan atau sudah tidak tersedia.`;
  if(status===409)return `${subject.charAt(0).toUpperCase()+subject.slice(1)} tidak dapat ${action} karena masih digunakan atau memiliki data terkait.`;
  if(status===422)return `Data ${subject} tidak valid. Periksa kembali isian yang wajib dan format datanya.`;
  if(status>=500&&/hapus/i.test(action))return `Server gagal ${action} ${subject} (HTTP ${status}). Data mungkin masih terhubung dengan data lain. Backend tidak mengirim detail penyebab kegagalan.`;
  if(status>=500)return `Server gagal ${action} ${subject} (HTTP ${status}). Backend tidak mengirim detail penyebab kegagalan.`;
  if(detail)return detail;
  return `Tidak dapat ${action} ${subject}. Silakan coba lagi.`;
}
