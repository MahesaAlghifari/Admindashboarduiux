import { apiGetJson, apiRequestJson } from "./http";

const STAFF_ENDPOINT = "/api/staff";

export type StaffId = number | string;

type Obj = Record<string, unknown>;

export interface Staff {
  id: StaffId | null;
  nik: string;
  nama_lengkap: string;
  nip: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  pendidikan_terakhir: string;
  status_pernikahan: string;
  alamat_lengkap: string;
  foto: string;
  jabatan: string;
  gaji_pokok: string;
  tanggal_bergabung: string;
  npwp: string;
  no_hp: string;
  email: string;
}


const STAFF_DETAIL_TTL = 5 * 60_000;

const staffDetailCache = new Map<
  string,
  {
    expiresAt: number;
    value: Staff;
  }
>();

export function invalidateStaffDetailCache(
  staffIds?: StaffId[]
): void {
  if (!staffIds?.length) {
    staffDetailCache.clear();
    return;
  }

  staffIds.forEach((staffId) => {
    staffDetailCache.delete(String(staffId));
  });
}

function getCachedStaffDetail(
  staffId: StaffId
): Staff | null {
  const key = String(staffId);
  const cached = staffDetailCache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    staffDetailCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedStaffDetail(
  staff: Staff
): void {
  if (staff.id === null) {
    return;
  }

  staffDetailCache.set(String(staff.id), {
    expiresAt: Date.now() + STAFF_DETAIL_TTL,
    value: staff,
  });
}

export interface StaffPayload {
  nik: string;
  nama_lengkap: string;
  nip: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  pendidikan_terakhir: string;
  status_pernikahan?: string;
  alamat_lengkap: string;
  foto: string;
  jabatan: string;
  gaji_pokok: string | number;
  tanggal_bergabung: string;
  npwp?: string;
  no_hp: string;
  email: string;
}

export interface CreateStaffPayload
  extends StaffPayload {
  password?: string;
}

export interface UpdateStaffPayload
  extends StaffPayload {
  password?: string;
}

type StaffSharedRequest = {
  nama_lengkap: string;
  nip: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  pendidikan_terakhir: string;
  alamat_lengkap: string;
  foto: string;
  jabatan: string;
  status_pernikahan: string;
  npwp: string;
  gaji_pokok: string;
  tanggal_bergabung: string;
  no_hp: string;
  email: string;
};

type CreateStaffRequest = StaffSharedRequest & {
  nik: string;
  password: string;
};

type UpdateStaffRequest = StaffSharedRequest & {
  password?: string;
};

const isObject = (
  value: unknown
): value is Obj =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const toObject = (
  value: unknown
): Obj =>
  isObject(value) ? value : {};

const toText = (
  ...values: unknown[]
): string => {
  for (const value of values) {
    if (
      value === null ||
      value === undefined
    ) {
      continue;
    }

    const normalized =
      String(value).trim();

    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const toRawString = (
  value: unknown
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
};

const toDate = (
  value: unknown
): string => {
  const normalized = toText(value);

  return normalized
    ? normalized.slice(0, 10)
    : "";
};

const toStaffId = (
  ...values: unknown[]
): StaffId | null => {
  for (const value of values) {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (typeof value === "string") {
      const normalized =
        value.trim();

      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
};

const toSalary = (
  value: unknown
): string => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "0";
  }

  const raw = String(value)
    .trim()
    .replace(/\s/g, "");

  if (!raw) {
    return "0";
  }

  const digits =
    raw.replace(/\D/g, "");

  return digits || "0";
};

const ensureStaffId = (
  staffId: StaffId
): string => {
  if (typeof staffId === "number") {
    if (!Number.isFinite(staffId)) {
      throw new Error(
        "ID staff tidak valid."
      );
    }

    return String(staffId);
  }

  const normalized =
    String(staffId).trim();

  if (!normalized) {
    throw new Error(
      "ID staff tidak valid."
    );
  }

  return normalized;
};

const birthPassword = (
  value: unknown
): string => {
  const date = toDate(value);

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      date
    );

  if (!match) {
    return "";
  }

  const [, year, month, day] =
    match;

  return `${day}${month}${year}`;
};

const extractList = (
  response: unknown
): unknown[] => {
  if (Array.isArray(response)) {
    return response;
  }

  const root = toObject(response);

  const keys = [
    "data",
    "staff",
    "items",
    "results",
  ];

  for (const key of keys) {
    const value = root[key];

    if (Array.isArray(value)) {
      return value;
    }

    const nested =
      toObject(value);

    for (const nestedKey of keys) {
      if (
        Array.isArray(
          nested[nestedKey]
        )
      ) {
        return nested[
          nestedKey
        ] as unknown[];
      }
    }
  }

  return [];
};

const extractDetail = (
  response: unknown
): unknown | null => {
  if (Array.isArray(response)) {
    return response[0] ?? null;
  }

  const root = toObject(response);

  if (!Object.keys(root).length) {
    return null;
  }

  const keys = [
    "data",
    "staff",
    "item",
    "result",
  ];

  for (const key of keys) {
    const value = root[key];

    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    if (
      isObject(value) &&
      Object.keys(value).length
    ) {
      const nested = value;

      for (const nestedKey of [
        "staff",
        "data",
        "item",
        "result",
      ]) {
        const nestedValue =
          nested[nestedKey];

        if (
          Array.isArray(nestedValue)
        ) {
          return (
            nestedValue[0] ??
            null
          );
        }

        if (
          isObject(nestedValue) &&
          Object.keys(
            nestedValue
          ).length
        ) {
          return nestedValue;
        }
      }

      return value;
    }
  }

  const entityFields = [
    "id",
    "staff_id",
    "staffid",
    "nik",
    "nip",
    "nama_lengkap",
    "fullname",
    "jabatan",
    "position",
    "tanggal_lahir",
    "tanggal_bergabung",
  ];

  if (
    entityFields.some((field) =>
      Object.prototype.hasOwnProperty.call(
        root,
        field
      )
    )
  ) {
    return root;
  }

  return null;
};

const ensureSuccess = <T>(
  response: T
): T => {
  const root = toObject(response);

  const status =
    toText(root.status).toLowerCase();

  if (
    root.success === false ||
    status === "error" ||
    status === "failed" ||
    status === "fail"
  ) {
    const detail = root.detail;

    let message =
      toText(root.message);

    if (
      !message &&
      typeof detail === "string"
    ) {
      message = detail;
    }

    if (
      !message &&
      Array.isArray(detail)
    ) {
      message = detail
        .map((item) => {
          const error =
            toObject(item);

          return (
            toText(error.msg) ||
            toText(error.message) ||
            toText(item)
          );
        })
        .filter(Boolean)
        .join(", ");
    }

    throw new Error(
      message ||
        "Request gagal diproses."
    );
  }

  return response;
};

export function normalizeStaff(
  raw: unknown
): Staff {
  const root = toObject(raw);

  const nestedStaff =
    toObject(
      root.staff ??
        root.profile ??
        root.biodata
    );

  const source =
    Object.keys(
      nestedStaff
    ).length
      ? {
          ...nestedStaff,
          ...root,
        }
      : root;

  const pribadi =
    toObject(
      source.pribadi ??
        nestedStaff.pribadi
    );

  const kepegawaian =
    toObject(
      source.kepegawaian ??
        nestedStaff.kepegawaian
    );

  const kontak =
    toObject(
      source.kontak ??
        nestedStaff.kontak
    );

  return {
    id: toStaffId(
      source.id,
      source.staff_id,
      source.staffid,
      nestedStaff.id,
      nestedStaff.staff_id,
      nestedStaff.staffid
    ),

    nik: toText(
      source.nik,
      nestedStaff.nik,
      pribadi.nik
    ),

    nama_lengkap: toText(
      source.nama_lengkap,
      source.fullname,
      source.nama,
      nestedStaff.nama_lengkap,
      nestedStaff.fullname,
      pribadi.nama_lengkap,
      pribadi.fullname
    ),

    nip: toText(
      source.nip,
      nestedStaff.nip,
      pribadi.nip
    ),

    tempat_lahir: toText(
      source.tempat_lahir,
      source.place_of_birth,
      source.birthplace,
      nestedStaff.tempat_lahir,
      nestedStaff.place_of_birth,
      pribadi.tempat_lahir,
      pribadi.place_of_birth
    ),

    tanggal_lahir: toDate(
      toText(
        source.tanggal_lahir,
        source.birthdate,
        source.date_of_birth,
        nestedStaff.tanggal_lahir,
        nestedStaff.birthdate,
        pribadi.tanggal_lahir,
        pribadi.birthdate
      )
    ),

    jenis_kelamin: toText(
      source.jenis_kelamin,
      source.gender,
      nestedStaff.jenis_kelamin,
      nestedStaff.gender,
      pribadi.jenis_kelamin,
      pribadi.gender
    ),

    agama: toText(
      source.agama,
      source.religion,
      nestedStaff.agama,
      nestedStaff.religion,
      pribadi.agama,
      pribadi.religion
    ),

    pendidikan_terakhir: toText(
      source.pendidikan_terakhir,
      source.education,
      source.last_education,
      nestedStaff.pendidikan_terakhir,
      nestedStaff.education,
      pribadi.pendidikan_terakhir,
      pribadi.education
    ),

    status_pernikahan: toText(
      source.status_pernikahan,
      source.marital_status,
      nestedStaff.status_pernikahan,
      nestedStaff.marital_status,
      pribadi.status_pernikahan,
      pribadi.marital_status
    ),

    alamat_lengkap: toText(
      source.alamat_lengkap,
      source.address,
      nestedStaff.alamat_lengkap,
      nestedStaff.address,
      pribadi.alamat_lengkap,
      pribadi.address
    ),

    foto: toRawString(
      source.foto ??
        source.photo ??
        nestedStaff.foto ??
        nestedStaff.photo ??
        pribadi.foto ??
        pribadi.photo
    ),

    jabatan: toText(
      source.jabatan,
      source.position,
      source.role,
      nestedStaff.jabatan,
      nestedStaff.position,
      kepegawaian.jabatan,
      kepegawaian.position
    ),

    gaji_pokok: toSalary(
      toText(
        source.gaji_pokok,
        source.salary,
        source.basic_salary,
        nestedStaff.gaji_pokok,
        kepegawaian.gaji_pokok,
        kepegawaian.salary
      )
    ),

    tanggal_bergabung: toDate(
      toText(
        source.tanggal_bergabung,
        source.datejoin,
        source.join_date,
        source.joined_at,
        nestedStaff.tanggal_bergabung,
        kepegawaian.tanggal_bergabung,
        kepegawaian.datejoin
      )
    ),

    npwp: toText(
      source.npwp,
      nestedStaff.npwp,
      pribadi.npwp,
      kepegawaian.npwp
    ),

    no_hp: toText(
      source.no_hp,
      source.contact,
      source.phone,
      source.phone_number,
      nestedStaff.no_hp,
      nestedStaff.contact,
      kontak.no_hp,
      kontak.contact,
      kontak.phone
    ),

    email: toText(
      source.email,
      nestedStaff.email,
      kontak.email
    ),
  };
}

const buildSharedStaffRequest = (data: StaffPayload): StaffSharedRequest => ({
  nama_lengkap: toText(data?.nama_lengkap),
  nip: toText(data?.nip),
  tempat_lahir: toText(data?.tempat_lahir),
  tanggal_lahir: toDate(data?.tanggal_lahir),
  jenis_kelamin: toText(data?.jenis_kelamin),
  agama: toText(data?.agama),
  pendidikan_terakhir: toText(data?.pendidikan_terakhir),
  alamat_lengkap: toText(data?.alamat_lengkap),
  foto: toRawString(data?.foto),
  jabatan: toText(data?.jabatan),
  status_pernikahan: toText(data?.status_pernikahan),
  npwp: toText(data?.npwp),
  gaji_pokok: toSalary(data?.gaji_pokok),
  tanggal_bergabung: toDate(data?.tanggal_bergabung),
  no_hp: toText(data?.no_hp),
  email: toText(data?.email).toLowerCase(),
});

const buildCreateStaffPayload = (data: CreateStaffPayload): CreateStaffRequest => {
  const password = toText(data?.password) || birthPassword(data?.tanggal_lahir);
  if (!password) throw new Error("Tanggal lahir wajib diisi dengan format yang valid untuk membuat password awal.");
  const nik = toText(data?.nik);
  if (!nik) throw new Error("NIK staff wajib diisi.");
  return { ...buildSharedStaffRequest(data), nik, password };
};

const buildUpdateStaffPayload = (data: UpdateStaffPayload): UpdateStaffRequest => {
  const payload: UpdateStaffRequest = buildSharedStaffRequest(data);
  const password = toText(data?.password);
  return password ? { ...payload, password } : payload;
};

export type FetchStaffOptions={search?:string;jabatan?:string;page?:number;limit?:number;signal?:AbortSignal;concurrency?:number;hydrateDetails?:boolean};

export async function fetchStaff(options:FetchStaffOptions={}):Promise<Staff[]> {
  const params=new URLSearchParams();
  const search=toText(options.search),jabatan=toText(options.jabatan);
  if(search) params.set("search",search);
  if(jabatan) params.set("jabatan",jabatan);
  if(Number.isFinite(options.page)&&Number(options.page)>0) params.set("page",String(Math.trunc(Number(options.page))));
  if(Number.isFinite(options.limit)&&Number(options.limit)>0) params.set("limit",String(Math.trunc(Number(options.limit))));
  const response=await apiGetJson<unknown>(`${STAFF_ENDPOINT}${params.size?`?${params.toString()}`:""}`,{signal:options.signal});
  const list=extractList(response).map(normalizeStaff);
  const missing=list.map((staff,index)=>({staff,index})).filter(({staff})=>staff.id!==null&&!staff.tanggal_lahir);
  if(!options.hydrateDetails||!missing.length) return list;
  const concurrency=Math.max(1,Math.min(options.concurrency??6,missing.length));
  let cursor=0;
  const worker=async()=>{
    while(cursor<missing.length){
      if(options.signal?.aborted) return;
      const current=missing[cursor++];
      try{list[current.index]=await fetchStaffById(current.staff.id as StaffId,options.signal);}catch(error){if(options.signal?.aborted) throw error;}
    }
  };
  await Promise.all(Array.from({length:concurrency},worker));
  return list;
}

export async function fetchStaffById(
  staffId: StaffId,
  signal?: AbortSignal,
  options: { fresh?: boolean } = {}
): Promise<Staff> {
  const normalizedId = ensureStaffId(staffId);

  if (!options.fresh) {
    const cached = getCachedStaffDetail(normalizedId);

    if (cached) {
      return cached;
    }
  }

  const response = await apiGetJson<unknown>(
    `${STAFF_ENDPOINT}/${encodeURIComponent(normalizedId)}`,
    { signal }
  );

  const detail = extractDetail(response);

  if (!detail) {
    throw new Error(
      "Data staff tidak ditemukan."
    );
  }

  const staff = normalizeStaff(detail);
  setCachedStaffDetail(staff);

  return staff;
}

export async function fetchStaffDetails(
  staffIds: StaffId[],
  options: {
    signal?: AbortSignal;
    concurrency?: number;
    fresh?: boolean;
  } = {}
): Promise<Staff[]> {
  const ids = [
    ...new Set(
      staffIds
        .filter((value) => value !== null && value !== undefined && String(value))
        .map((value) => String(value))
    ),
  ];

  if (!ids.length) {
    return [];
  }

  const results = new Array<Staff | null>(ids.length).fill(null);
  const concurrency = Math.max(
    1,
    Math.min(options.concurrency ?? 3, ids.length)
  );

  let cursor = 0;

  const worker = async () => {
    while (true) {
      if (options.signal?.aborted) {
        return;
      }

      const index = cursor;
      cursor += 1;

      if (index >= ids.length) {
        return;
      }

      try {
        results[index] = await fetchStaffById(
          ids[index],
          options.signal,
          { fresh: options.fresh }
        );
      } catch {
        if (options.signal?.aborted) {
          return;
        }

        results[index] = null;
      }
    }
  };

  await Promise.all(
    Array.from({ length: concurrency }, () => worker())
  );

  return results.filter(
    (value): value is Staff => value !== null
  );
}

export async function createStaff(
  data: CreateStaffPayload
): Promise<Staff | null> {
  const response = ensureSuccess(
    await apiRequestJson<unknown>(
      STAFF_ENDPOINT,
      {
        method: "POST",
        jsonBody:
          buildCreateStaffPayload(
            data
          ),
      }
    )
  );

  const detail =
    extractDetail(response);

  if (!detail) {
    return null;
  }

  const staff = normalizeStaff(detail);
  setCachedStaffDetail(staff);

  return staff;
}

export async function updateStaff(
  staffId: StaffId,
  data: UpdateStaffPayload
): Promise<Staff | null> {
  const normalizedId =
    ensureStaffId(staffId);

  const response = ensureSuccess(
    await apiRequestJson<unknown>(
      `${STAFF_ENDPOINT}/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method: "PUT",
        jsonBody:
          buildUpdateStaffPayload(
            data
          ),
      }
    )
  );

  const detail =
    extractDetail(response);

  invalidateStaffDetailCache([normalizedId]);

  if (!detail) {
    return null;
  }

  const staff = normalizeStaff(detail);
  setCachedStaffDetail(staff);

  return staff;
}

export async function deleteStaff(
  staffId: StaffId
): Promise<void> {
  const normalizedId =
    ensureStaffId(staffId);

  ensureSuccess(
    await apiRequestJson<unknown>(
      `${STAFF_ENDPOINT}/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method: "DELETE",
      }
    )
  );

  invalidateStaffDetailCache([normalizedId]);
}