import { apiGetJson, apiRequestJson } from "./http";

export interface ApiEmployeesResponse {
  status: string;
  data: ApiEmployee[];
}

export interface ApiEmployee {
  employeeid: number;
  nip?: string | null;
  fullname?: string | null;
  gender?: string | null;
  fronttitle?: string | null;
  backtitle?: string | null;
  education?: string | null;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  place_of_birth?: string | null;
  birthdate?: string | null;
  photo?: string | null;
  npwp?: string | null;
  marital_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EmployeeUpsertRequest {
  nip?: string | null;
  fullname?: string | null;
  gender?: string | null;
  fronttitle?: string | null;
  backtitle?: string | null;
  education?: string | null;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  place_of_birth?: string | null;
  birthdate?: string | null;
  photo?: string | null;
  npwp?: string | null;
  marital_status?: string | null;
}

function normalizeEmployeePayload(payload: EmployeeUpsertRequest) {
  return {
    ...payload,
    photo:
      payload.photo === undefined || payload.photo === null
        ? ""
        : payload.photo,
  } satisfies EmployeeUpsertRequest;
}

type ApiWriteResponse = {
  status?: "success" | "error" | string;
  message?: string;
  data?: unknown;
};

function assertWriteSuccess(res: ApiWriteResponse) {
  if (res && typeof res === "object" && "status" in res) {
    const status = String(res.status ?? "").toLowerCase();
    if (status && status !== "success") {
      throw new Error(res.message || `Request failed (${res.status})`);
    }
  }
  return res;
}

export async function fetchEmployees(): Promise<ApiEmployee[]> {
  const res = await apiGetJson<ApiEmployeesResponse>("/api/employees");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createEmployee(payload: EmployeeUpsertRequest) {
  const res = await apiRequestJson<ApiWriteResponse>("/api/employees", {
    method: "POST",
    jsonBody: normalizeEmployeePayload(payload),
  });
  return assertWriteSuccess(res);
}

export async function updateEmployee(
  employeeId: number | string,
  payload: EmployeeUpsertRequest
) {
  const res = await apiRequestJson<ApiWriteResponse>(
    `/api/employees/${employeeId}`,
    {
      method: "PUT",
      jsonBody: normalizeEmployeePayload(payload),
    }
  );
  return assertWriteSuccess(res);
}

export async function deleteEmployee(employeeId: number | string) {
  const res = await apiRequestJson<ApiWriteResponse>(
    `/api/employees/${employeeId}`,
    {
      method: "DELETE",
    }
  );
  return assertWriteSuccess(res);
}

function isoDateToYmd(value?: string | null) {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function mapEmployeeToUiRow(employee: ApiEmployee) {
  return {
    // DataTable needs stable id
    id: String(employee.employeeid),

    // Existing UI expects these keys
    nama: employee.fullname ?? "",
    nip: employee.nip ?? "",

    // Not available in API response; keep UI stable
    jabatan: "-",
    status: "Aktif",

    // Keep raw for modal/edit
    originalApi: {
      ...employee,
      birthdate: isoDateToYmd(employee.birthdate),
    },
  };
}
