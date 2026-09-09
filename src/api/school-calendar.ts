import {
  fetchAcademicPeriods,
  fetchCurrentAcademicPeriod,
  type AcademicPeriod,
} from "./academic-periods";
import {
  createAnnouncement,
  fetchAnnouncements,
  type Announcement,
  type AnnouncementTarget,
} from "./administrasi";

export type SchoolHolidaySource =
  | "announcement"
  | "semester-break"
  | "weekend";

export interface SchoolHoliday {
  date: string;
  label: string;
  source: SchoolHolidaySource;
  announcement_id?: number | string | null;
  description?: string;
}

export interface SchoolCalendarContext {
  period: AcademicPeriod;
  announcement_holidays: SchoolHoliday[];
}

export interface SchoolDayStatus {
  date: string;
  in_active_period: boolean;
  is_holiday: boolean;
  label: string;
  source: SchoolHolidaySource | null;
  description: string;
}

export interface HolidayRangeInput {
  judul: string;
  isi: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  target_audien?: AnnouncementTarget;
}

export interface HolidayRangeResult {
  created: Announcement[];
  skipped_dates: string[];
}

export interface SemesterBreakSyncResult {
  created: Announcement[];
  skipped: number;
}

const text = (value: unknown) => String(value ?? "").trim();
const dateOnly = (value: unknown) => text(value).slice(0, 10);

function dateFromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly(value));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function addCalendarDays(value: string, amount: number) {
  const date = dateFromIso(value);
  if (!date) return "";
  date.setDate(date.getDate() + amount);
  return isoDate(date);
}

function isWeekend(value: string) {
  const date = dateFromIso(value);
  if (!date) return false;
  const day = date.getDay();
  return day === 0 || day === 6;
}

function periodBounds(period: AcademicPeriod) {
  return {
    start: dateOnly(period.tanggal_mulai),
    end: dateOnly(period.tanggal_selesai),
  };
}

export function isDateInsideAcademicPeriod(
  value: string,
  period: AcademicPeriod
) {
  const date = dateOnly(value);
  const { start, end } = periodBounds(period);
  if (!date || !start || !end) return false;
  return date >= start && date <= end;
}

async function fetchAllSchoolHolidayAnnouncements(
  signal?: AbortSignal
): Promise<Announcement[]> {
  const output: Announcement[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await fetchAnnouncements({
      tipe: "Libur",
      target_audien: "Semua",
      page,
      per_page: 100,
      signal,
    });

    output.push(...result.items);
    totalPages = Math.max(1, Number(result.total_pages) || 1);
    page += 1;
  } while (page <= totalPages);

  return output;
}

export async function fetchSchoolCalendarContext(
  signal?: AbortSignal,
  periodInput?: AcademicPeriod | null
): Promise<SchoolCalendarContext> {
  const [period, announcements] = await Promise.all([
    periodInput ?? fetchCurrentAcademicPeriod(signal),
    fetchAllSchoolHolidayAnnouncements(signal),
  ]);

  const announcement_holidays = announcements
    .map((announcement): SchoolHoliday | null => {
      const date = dateOnly(announcement.tanggal_terbit);
      if (!date) return null;
      return {
        date,
        label: text(announcement.judul) || "Hari Libur",
        source: "announcement",
        announcement_id: announcement.id,
        description: text(announcement.isi),
      };
    })
    .filter((value): value is SchoolHoliday => value !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return { period, announcement_holidays };
}

export function resolveSchoolDayStatus(
  value: string,
  context: SchoolCalendarContext
): SchoolDayStatus {
  const date = dateOnly(value);
  if (!date) {
    return {
      date: "",
      in_active_period: false,
      is_holiday: true,
      label: "Tanggal tidak valid",
      source: "semester-break",
      description: "Tanggal tidak valid.",
    };
  }

  const inPeriod = isDateInsideAcademicPeriod(date, context.period);

  if (!inPeriod) {
    return {
      date,
      in_active_period: false,
      is_holiday: true,
      label: "Libur Semester",
      source: "semester-break",
      description: `Tanggal ${date} berada di luar ${
        text(context.period.nama_periode) ||
        `${text(context.period.tahun_ajaran)} Semester ${context.period.semester}`
      }.`,
    };
  }

  const announcement = context.announcement_holidays.find(
    (holiday) => holiday.date === date
  );

  if (announcement) {
    return {
      date,
      in_active_period: true,
      is_holiday: true,
      label: announcement.label,
      source: "announcement",
      description: announcement.description || "Hari libur sekolah.",
    };
  }

  if (isWeekend(date)) {
    return {
      date,
      in_active_period: true,
      is_holiday: true,
      label: "Akhir Pekan",
      source: "weekend",
      description: "Tidak ada input kegiatan sekolah pada akhir pekan.",
    };
  }

  return {
    date,
    in_active_period: true,
    is_holiday: false,
    label: "Hari Efektif",
    source: null,
    description: "Hari efektif pada periode akademik aktif.",
  };
}

export async function fetchSchoolDayStatus(
  value: string,
  signal?: AbortSignal
) {
  const context = await fetchSchoolCalendarContext(signal);
  return resolveSchoolDayStatus(value, context);
}

export async function fetchSchoolWeekStatuses(
  weekStart: string,
  signal?: AbortSignal
) {
  const context = await fetchSchoolCalendarContext(signal);
  return Array.from({ length: 5 }, (_, index) =>
    resolveSchoolDayStatus(addCalendarDays(weekStart, index), context)
  );
}

function rangeDates(from: string, to: string) {
  const start = dateOnly(from);
  const end = dateOnly(to);
  if (!dateFromIso(start) || !dateFromIso(end) || end < start) {
    throw new Error("Rentang tanggal libur tidak valid.");
  }

  const output: string[] = [];
  for (let value = start; value <= end; value = addCalendarDays(value, 1)) {
    output.push(value);
    if (output.length > 370) {
      throw new Error("Rentang hari libur terlalu panjang. Maksimal 370 hari.");
    }
  }
  return output;
}

/**
 * Backend announcements hanya menyediakan satu tanggal_terbit per record.
 * Untuk rentang libur, frontend membuat satu record Libur per tanggal agar
 * seluruh data tetap tersimpan native di backend tanpa field tambahan.
 */
export async function createHolidayAnnouncementRange(
  input: HolidayRangeInput
): Promise<HolidayRangeResult> {
  const judul = text(input.judul);
  const isi = text(input.isi);
  if (!judul || !isi) {
    throw new Error("Judul dan isi hari libur wajib diisi.");
  }

  const dates = rangeDates(input.tanggal_mulai, input.tanggal_selesai);
  const existing = await fetchAllSchoolHolidayAnnouncements();
  const occupied = new Set(existing.map((item) => dateOnly(item.tanggal_terbit)));
  const created: Announcement[] = [];
  const skipped_dates: string[] = [];

  const pending = dates.filter((date) => {
    if (occupied.has(date)) {
      skipped_dates.push(date);
      return false;
    }
    return true;
  });

  // Backend belum punya bulk announcement. Batasi concurrency agar rentang panjang
  // tetap cepat tanpa membanjiri API.
  for (let index = 0; index < pending.length; index += 4) {
    const chunk = pending.slice(index, index + 4);
    const results = await Promise.all(
      chunk.map((date) =>
        createAnnouncement({
          judul,
          isi,
          tanggal_terbit: date,
          tipe: "Libur",
          target_audien: "Semua",
        })
      )
    );
    created.push(...results);
    chunk.forEach((date) => occupied.add(date));
  }

  return { created, skipped_dates };
}

function breakTitle(_previous: AcademicPeriod, _next: AcademicPeriod) {
  return "Libur Semester";
}

function breakDescription(
  _previous: AcademicPeriod,
  next: AcademicPeriod,
  from: string,
  to: string
) {
  const nextName =
    text(next.nama_periode) ||
    `${text(next.tahun_ajaran)} Semester ${Number(next.semester) || 1}`;
  return `Libur sekolah ${from} s.d. ${to}. Kegiatan efektif berikutnya dimulai ${dateOnly(
    next.tanggal_mulai
  )} pada ${nextName}.`;
}

/**
 * Membuat pemberitahuan rentang libur yang berada di antara dua periode yang
 * sudah terdaftar. Hanya satu announcement dibuat pada tanggal awal libur;
 * status hari di modul Kegiatan tetap dihitung langsung dari rentang periode.
 */
export async function syncSemesterBreakAnnouncements(): Promise<SemesterBreakSyncResult> {
  const [periods, existing] = await Promise.all([
    fetchAcademicPeriods(),
    fetchAllSchoolHolidayAnnouncements(),
  ]);

  const sorted = [...periods]
    .filter((period) => dateOnly(period.tanggal_mulai) && dateOnly(period.tanggal_selesai))
    .sort((a, b) =>
      dateOnly(a.tanggal_mulai).localeCompare(dateOnly(b.tanggal_mulai))
    );

  const signatures = new Set(
    existing.map(
      (item) => `${dateOnly(item.tanggal_terbit)}|${text(item.judul).toLowerCase()}`
    )
  );
  const created: Announcement[] = [];
  let skipped = 0;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const previous = sorted[index];
    const next = sorted[index + 1];
    const from = addCalendarDays(dateOnly(previous.tanggal_selesai), 1);
    const to = addCalendarDays(dateOnly(next.tanggal_mulai), -1);

    if (!from || !to || from > to) continue;

    const judul = breakTitle(previous, next);
    const signature = `${from}|${judul.toLowerCase()}`;
    if (signatures.has(signature)) {
      skipped += 1;
      continue;
    }

    const announcement = await createAnnouncement({
      judul,
      isi: breakDescription(previous, next, from, to),
      tanggal_terbit: from,
      tipe: "Libur",
      target_audien: "Semua",
    });
    created.push(announcement);
    signatures.add(signature);
  }

  return { created, skipped };
}
