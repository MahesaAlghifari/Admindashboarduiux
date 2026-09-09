import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import {
  createSchedule,
  deleteSchedule,
  fetchAllJournals,
  fetchScheduleWeek,
  fetchSchedules,
  updateSchedule,
} from "../../../api/administrasi";
import {
  fetchAllClassrooms,
} from "../../../api/classrooms";
import {
  SectionHeader,
} from "../../../components/common/DesignSystem";
import {
  adminQueryKeys,
} from "../../../lib/adminQueryKeys";
import {
  apiErrorMessage,
} from "../../../lib/apiError";

const ITEMS_PER_PAGE = 10;
const MASTER_STALE_TIME =
  5 * 60_000;
const SCHEDULE_STALE_TIME =
  60_000;
const BULK_CONCURRENCY = 4;
// Schedule creation is intentionally serialized. Some backend/database
// deployments return HTTP 500 when several schedule inserts run concurrently.
const SCHEDULE_CREATE_CONCURRENCY = 1;
const ALL_CLASSROOMS_VALUE =
  "__ALL_CLASSROOMS__";

const text = (value) =>
  String(value ?? "").trim();

const keyOf = (value) =>
  String(value ?? "");

const sameId = (left, right) =>
  keyOf(left) === keyOf(right);

const emptyForm = () => ({
  id: null,
  classroom_id: "",
  journal_id: "",
  minggu: "",
});

const localDate = (date) =>
  [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");

function dateToIsoWeek(value) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      text(value)
    );

  if (!match) {
    return "";
  }

  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    )
  );

  const day =
    date.getUTCDay() || 7;

  date.setUTCDate(
    date.getUTCDate() +
      4 -
      day
  );

  const yearStart =
    new Date(
      Date.UTC(
        date.getUTCFullYear(),
        0,
        1
      )
    );

  const week = Math.ceil(
    ((date - yearStart) /
      86_400_000 +
      1) /
      7
  );

  return `${date.getUTCFullYear()}-W${String(
    week
  ).padStart(2, "0")}`;
}

function getWeekRange(value) {
  const match =
    /^(\d{4})-W(\d{2})$/.exec(
      text(value)
    );

  if (!match) {
    return {
      start: "",
      end: "",
      weekNumber: "-",
      rangeLabel: "-",
    };
  }

  const year =
    Number(match[1]);

  const week =
    Number(match[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(week) ||
    week < 1 ||
    week > 53
  ) {
    return {
      start: "",
      end: "",
      weekNumber: "-",
      rangeLabel: "-",
    };
  }

  const januaryFourth =
    new Date(year, 0, 4);

  const day =
    januaryFourth.getDay() || 7;

  const monday =
    new Date(januaryFourth);

  monday.setDate(
    januaryFourth.getDate() -
      day +
      1 +
      (week - 1) * 7
  );

  const friday =
    new Date(monday);

  friday.setDate(
    monday.getDate() + 4
  );

  const startMonth =
    monday.toLocaleDateString(
      "id-ID",
      {
        month: "short",
      }
    );

  const endMonth =
    friday.toLocaleDateString(
      "id-ID",
      {
        month: "short",
      }
    );

  const yearLabel =
    friday.getFullYear();

  const rangeLabel =
    startMonth === endMonth
      ? `${monday.getDate()}–${friday.getDate()} ${endMonth} ${yearLabel}`
      : `${monday.getDate()} ${startMonth}–${friday.getDate()} ${endMonth} ${yearLabel}`;

  return {
    start: localDate(monday),
    end: localDate(friday),
    weekNumber:
      String(week),
    rangeLabel,
  };
}

function groupedByTheme(items) {
  const groups = new Map();

  items.forEach((item) => {
    const theme =
      text(item?.tema) ||
      "Tanpa Tema";

    if (!groups.has(theme)) {
      groups.set(theme, []);
    }

    groups
      .get(theme)
      .push(item);
  });

  return [...groups.entries()]
    .sort(([left], [right]) =>
      left.localeCompare(
        right,
        "id",
        {
          numeric: true,
          sensitivity:
            "base",
        }
      )
    )
    .map(
      ([theme, journals]) => ({
        theme,
        journals: [
          ...journals,
        ].sort(
          (left, right) =>
            text(
              left?.pilar_karakter
            ).localeCompare(
              text(
                right?.pilar_karakter
              ),
              "id",
              {
                numeric: true,
                sensitivity:
                  "base",
              }
            )
        ),
      })
    );
}

async function settleWithConcurrency(
  items,
  worker,
  limit = BULK_CONCURRENCY
) {
  if (!items.length) {
    return [];
  }

  const results =
    new Array(items.length);

  let cursor = 0;

  const run = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;

      if (
        index >=
        items.length
      ) {
        return;
      }

      try {
        results[index] = {
          status:
            "fulfilled",
          value:
            await worker(
              items[index],
              index
            ),
        };
      } catch (reason) {
        results[index] = {
          status:
            "rejected",
          reason,
        };
      }
    }
  };

  const size = Math.max(
    1,
    Math.min(
      limit,
      items.length
    )
  );

  await Promise.all(
    Array.from(
      { length: size },
      run
    )
  );

  return results;
}

async function createScheduleSafely(
  payload
) {
  try {
    return {
      value:
        await createSchedule(
          payload
        ),
      verified: false,
    };
  } catch (error) {
    try {
      const verify =
        await fetchSchedules({
          classroom_id:
            payload.classroom_id,
          week_start_date:
            payload.week_start_date,
          page: 1,
          per_page: 100,
        });

      const saved =
        verify.items.find(
          (item) =>
            sameId(
              item.classroom_id,
              payload.classroom_id
            ) &&
            text(
              item.week_start_date ||
                item.tanggal
            ) ===
              payload.week_start_date &&
            sameId(
              item.journal_id ??
                item.journal?.id,
              payload.journal_id
            )
        );

      if (saved) {
        return {
          value: saved,
          verified: true,
        };
      }
    } catch {}

    throw error;
  }
}

function NoticeModal({
  notice,
  onClose,
}) {
  if (!notice) {
    return null;
  }

  const danger =
    notice.tone === "danger";

  const Icon = danger
    ? ExclamationTriangleIcon
    : CheckCircleIcon;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start gap-3 px-5 py-4">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              danger
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-800">
              {notice.title}
            </h3>

            <p className="mt-1 whitespace-pre-line text-[11px] leading-5 text-slate-500">
              {notice.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="ui-action-button"
          >
            Tutup
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfirmModal({
  confirm,
  busy,
  onCancel,
  onConfirm,
}) {
  if (!confirm) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]"
      onMouseDown={() => {
        if (!busy) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start gap-3 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-800">
              {confirm.title}
            </h3>

            <p className="mt-1 whitespace-pre-line text-[11px] leading-5 text-slate-500">
              {confirm.message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="ui-action-button"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 text-[10px] font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && (
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
            )}
            Hapus
          </button>
        </div>
      </section>
    </div>
  );
}

function Meta({
  label,
  value,
}) {
  return (
    <div>
      <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <span className="mt-0.5 block text-[11px] leading-4 text-slate-600">
        {text(value) || "-"}
      </span>
    </div>
  );
}

export default function Jadwal() {
  const queryClient =
    useQueryClient();

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    classroomFilter,
    setClassroomFilter,
  ] = useState("");

  const [
    filtersOpen,
    setFiltersOpen,
  ] = useState(false);

  const [page, setPage] =
    useState(1);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [form, setForm] =
    useState(emptyForm());

  const [
    selectMode,
    setSelectMode,
  ] = useState(false);

  const [
    selectedIds,
    setSelectedIds,
  ] = useState([]);

  const [
    notice,
    setNotice,
  ] = useState(null);

  const [
    confirm,
    setConfirm,
  ] = useState(null);

  const params = useMemo(
    () => ({
      classroom_id:
        classroomFilter ||
        undefined,
      q:
        searchQuery ||
        undefined,
      page,
      per_page:
        ITEMS_PER_PAGE,
    }),
    [
      classroomFilter,
      page,
      searchQuery,
    ]
  );

  const scheduleQuery = useQuery({
    queryKey:
      adminQueryKeys.scheduleList(
        params
      ),
    queryFn: ({ signal }) =>
      fetchSchedules({
        ...params,
        signal,
      }),
    placeholderData:
      (previous) => previous,
    staleTime:
      SCHEDULE_STALE_TIME,
  });

  const classroomQuery =
    useQuery({
      queryKey:
        adminQueryKeys.classroomMaster,
      queryFn: ({ signal }) =>
        fetchAllClassrooms(
          100,
          signal
        ),
      staleTime:
        MASTER_STALE_TIME,
    });

  const journalQuery =
    useQuery({
      queryKey:
        adminQueryKeys.journalMaster,
      queryFn: ({ signal }) =>
        fetchAllJournals(
          100,
          signal
        ),
      staleTime:
        MASTER_STALE_TIME,
      enabled: modalOpen,
    });

  const saveMutation =
    useMutation({
      mutationFn: ({
        id,
        payload,
      }) =>
        id == null
          ? createSchedule(
              payload
            )
          : updateSchedule(
              id,
              payload
            ),
    });

  const createMutation =
    useMutation({
      mutationFn:
        createScheduleSafely,
    });

  const createManyMutation =
    useMutation({
      mutationFn:
        async (entries) => {
          const settled =
            await settleWithConcurrency(
              entries,
              (entry) =>
                createScheduleSafely(
                  entry.payload
                ),
              SCHEDULE_CREATE_CONCURRENCY
            );

          return settled.map(
            (result, index) => {
              const entry =
                entries[index];

              if (
                result.status ===
                "fulfilled"
              ) {
                return {
                  ...entry,
                  status:
                    "fulfilled",
                  value:
                    result.value
                      .value,
                  verified:
                    result.value
                      .verified,
                };
              }

              return {
                ...entry,
                status:
                  "rejected",
                reason:
                  result.reason,
              };
            }
          );
        },
    });

  const deleteMutation =
    useMutation({
      mutationFn: (id) =>
        deleteSchedule(id),
    });

  const bulkDeleteMutation =
    useMutation({
      mutationFn: (ids) =>
        settleWithConcurrency(
          ids,
          (id) =>
            deleteSchedule(id),
          BULK_CONCURRENCY
        ),
    });

  const response =
    scheduleQuery.data;

  const rows =
    Array.isArray(
      response?.items
    )
      ? response.items
      : [];

  const journals =
    Array.isArray(
      journalQuery.data
    )
      ? journalQuery.data
      : [];

  const classrooms =
    Array.isArray(
      classroomQuery.data
    )
      ? classroomQuery.data
      : [];

  const total =
    Number(response?.total) ||
    0;

  const totalPages =
    Math.max(
      1,
      Number(
        response?.total_pages
      ) || 1
    );

  const loading =
    scheduleQuery.isPending;

  const refreshing =
    scheduleQuery.isFetching &&
    !scheduleQuery.isPending;

  const classroomLoading =
    classroomQuery.isPending;

  const journalLoading =
    modalOpen &&
    journalQuery.isPending;

  const masterLoading =
    classroomLoading ||
    journalLoading;

  const saving =
    saveMutation.isPending ||
    createMutation.isPending ||
    createManyMutation.isPending;

  const bulkDeleting =
    bulkDeleteMutation.isPending;

  const deletingId =
    deleteMutation.isPending
      ? keyOf(
          deleteMutation.variables
        )
      : null;

  const filtersActive =
    Boolean(
      classroomFilter ||
        searchQuery
    );

  const error = [
    scheduleQuery.isError
      ? apiErrorMessage(
          scheduleQuery.error,
          {
            action:
              "memuat",
            subject:
              "jadwal",
          }
        )
      : "",
    classroomQuery.isError
      ? apiErrorMessage(
          classroomQuery.error,
          {
            action:
              "memuat",
            subject:
              "kelas",
          }
        )
      : "",
    modalOpen &&
    journalQuery.isError
      ? apiErrorMessage(
          journalQuery.error,
          {
            action:
              "memuat",
            subject:
              "perencanaan",
          }
        )
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey:
          adminQueryKeys.schedules,
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "kegiatan",
          "daily-week",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "kegiatan",
          "schedule",
        ],
      }),
    ]);

  const classroomMap =
    useMemo(
      () =>
        new Map(
          classrooms
            .filter(
              (item) =>
                item?.id !==
                  null &&
                item?.id !==
                  undefined
            )
            .map((item) => [
              keyOf(item.id),
              item,
            ])
        ),
      [classrooms]
    );

  const groupedJournals =
    useMemo(
      () =>
        groupedByTheme(
          journals
        ),
      [journals]
    );

  const selectedJournal =
    useMemo(
      () =>
        journals.find(
          (item) =>
            sameId(
              item.id,
              form.journal_id
            )
        ) || null,
      [
        form.journal_id,
        journals,
      ]
    );

  const visibleIds =
    useMemo(
      () =>
        rows
          .map(
            (item) =>
              item?.id
          )
          .filter(
            (id) =>
              id !== null &&
              id !== undefined
          )
          .map(keyOf),
      [rows]
    );

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) =>
      selectedIds.includes(id)
    );

  const someVisibleSelected =
    visibleIds.some((id) =>
      selectedIds.includes(id)
    ) &&
    !allVisibleSelected;

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setPage(1);
        setSearchQuery(
          text(searchInput)
        );
      }, 300);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [classroomFilter]);

  useEffect(() => {
    if (!response) {
      return;
    }

    if (
      total === 0 &&
      page > 1
    ) {
      setPage(1);
      return;
    }

    if (
      total > 0 &&
      page > totalPages
    ) {
      setPage(totalPages);
    }
  }, [
    page,
    response,
    total,
    totalPages,
  ]);

  useEffect(() => {
    setSelectedIds([]);
  }, [
    page,
    classroomFilter,
    searchQuery,
  ]);

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditing(false);
    setForm(emptyForm());
  };

  const openModal = (item) => {
    if (selectMode) {
      return;
    }

    if (item) {
      const date =
        text(
          item.week_start_date
        ) ||
        text(item.tanggal);

      setForm({
        id: item.id,
        classroom_id:
          item.classroom_id ==
          null
            ? ""
            : keyOf(
                item.classroom_id
              ),
        journal_id:
          item.journal_id !=
          null
            ? keyOf(
                item.journal_id
              )
            : item.journal?.id !=
                null
              ? keyOf(
                  item.journal.id
                )
              : "",
        minggu:
          dateToIsoWeek(date),
      });

      setEditing(true);
    } else {
      setForm(emptyForm());
      setEditing(false);
    }

    setModalOpen(true);
  };

  const setField = (
    key,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const checkDuplicate =
    async ({
      classroomId,
      weekStartDate,
      currentId,
    }) => {
      const duplicateResponse =
        await fetchSchedules({
          classroom_id:
            classroomId,
          week_start_date:
            weekStartDate,
          page: 1,
          per_page: 100,
        });

      return duplicateResponse
        .items
        .find(
          (item) =>
            sameId(
              item.classroom_id,
              classroomId
            ) &&
            text(
              item.week_start_date ||
                item.tanggal
            ) ===
              weekStartDate &&
            !sameId(
              item.id,
              currentId
            )
        );
    };

  const save = async (
    event
  ) => {
    event.preventDefault();

    const all =
      !editing &&
      form.classroom_id ===
        ALL_CLASSROOMS_VALUE;

    const classroomId = all
      ? null
      : Number(
          form.classroom_id
        );

    const journalId =
      Number(form.journal_id);

    const weekInfo =
      getWeekRange(
        form.minggu
      );

    if (
      !all &&
      (!Number.isInteger(
        classroomId
      ) ||
        classroomId <= 0)
    ) {
      setNotice({
        tone: "danger",
        title:
          "Kelas Belum Dipilih",
        message:
          "Pilih kelas yang valid terlebih dahulu.",
      });
      return;
    }

    if (
      !Number.isInteger(
        journalId
      ) ||
      journalId <= 0
    ) {
      setNotice({
        tone: "danger",
        title:
          "Perencanaan Belum Dipilih",
        message:
          "Pilih perencanaan pembelajaran yang valid.",
      });
      return;
    }

    if (!weekInfo.start) {
      setNotice({
        tone: "danger",
        title:
          "Minggu Belum Dipilih",
        message:
          "Pilih minggu pelaksanaan terlebih dahulu.",
      });
      return;
    }

    try {
      if (all) {
        const validClassrooms =
          classrooms.filter(
            (item) =>
              Number.isInteger(
                Number(item?.id)
              ) &&
              Number(item.id) >
                0
          );

        if (
          !validClassrooms.length
        ) {
          setNotice({
            tone: "danger",
            title:
              "Kelas Belum Tersedia",
            message:
              "Belum ada kelas yang dapat dijadwalkan.",
          });
          return;
        }

        const existing =
          await fetchScheduleWeek(
            weekInfo.start
          );

        const scheduled =
          new Set(
            existing
              .filter(
                (item) =>
                  text(
                    item.week_start_date ||
                      item.tanggal
                  ) ===
                  weekInfo.start
              )
              .map((item) =>
                keyOf(
                  item.classroom_id
                )
              )
              .filter(Boolean)
          );

        const targets =
          validClassrooms.filter(
            (item) =>
              !scheduled.has(
                keyOf(item.id)
              )
          );

        const skipped =
          validClassrooms.length -
          targets.length;

        if (!targets.length) {
          setNotice({
            tone: "danger",
            title:
              "Jadwal Sudah Tersedia",
            message:
              `Semua kelas sudah memiliki jadwal untuk minggu ${weekInfo.rangeLabel}.`,
          });
          return;
        }

        const entries =
          targets.map(
            (classroom) => ({
              classroom,
              payload: {
                classroom_id:
                  classroom.id,
                journal_id:
                  journalId,
                week_start_date:
                  weekInfo.start,
                tanggal:
                  weekInfo.start,
              },
            })
          );

        const results =
          await createManyMutation.mutateAsync(
            entries
          );

        const failed =
          results.filter(
            (item) =>
              item.status ===
              "rejected"
          );

        const fulfilled =
          results.filter(
            (item) =>
              item.status ===
              "fulfilled"
          );

        const verified =
          fulfilled.filter(
            (item) =>
              item.verified
          ).length;

        const success =
          fulfilled.length;

        if (success > 0) {
          closeModal();
          await invalidate();
        }

        const message = [
          `${success} kelas berhasil dibuatkan jadwal.`,
          verified
            ? `${verified} jadwal terverifikasi sudah tersimpan meskipun response POST sempat gagal.`
            : "",
          skipped
            ? `${skipped} kelas dilewati karena sudah memiliki jadwal pada minggu tersebut.`
            : "",
          failed.length
            ? `${failed.length} kelas gagal: ${failed
                .map(
                  (item) =>
                    text(
                      item
                        .classroom
                        ?.nama_kelas
                    ) ||
                    `Kelas #${item.classroom?.id ?? "-"}`
                )
                .join(", ")}.`
            : "",
          failed[0]
            ? apiErrorMessage(
                failed[0].reason,
                {
                  action:
                    "menambahkan",
                  subject:
                    "jadwal",
                }
              )
            : "",
        ]
          .filter(Boolean)
          .join("\n");

        setNotice({
          tone:
            failed.length
              ? "danger"
              : "success",
          title:
            failed.length
              ? "Jadwal Sebagian Gagal"
              : "Jadwal Berhasil Dibuat",
          message,
        });

        return;
      }

      const duplicate =
        await checkDuplicate({
          classroomId,
          weekStartDate:
            weekInfo.start,
          currentId:
            form.id,
        });

      if (duplicate) {
        const classroom =
          classroomMap.get(
            keyOf(
              classroomId
            )
          );

        setNotice({
          tone: "danger",
          title:
            "Jadwal Sudah Tersedia",
          message:
            `${text(classroom?.nama_kelas) || "Kelas ini"} sudah memiliki jadwal untuk minggu ${weekInfo.rangeLabel}. Silakan edit jadwal yang tersedia.`,
        });

        return;
      }

      const payload = {
        classroom_id:
          classroomId,
        journal_id:
          journalId,
        week_start_date:
          weekInfo.start,
        tanggal:
          weekInfo.start,
      };

      if (editing) {
        await saveMutation.mutateAsync(
          {
            id: form.id,
            payload,
          }
        );
      } else {
        await createMutation.mutateAsync(
          payload
        );
      }

      const classroom =
        classroomMap.get(
          keyOf(classroomId)
        );

      const title = editing
        ? "Jadwal Berhasil Diperbarui"
        : "Jadwal Berhasil Ditambahkan";

      closeModal();
      await invalidate();

      setNotice({
        tone: "success",
        title,
        message:
          `${text(classroom?.nama_kelas) || "Kelas"} · ${weekInfo.rangeLabel} berhasil disimpan.`,
      });
    } catch (error) {
      setNotice({
        tone: "danger",
        title: editing
          ? "Jadwal Gagal Diperbarui"
          : "Jadwal Gagal Ditambahkan",
        message:
          apiErrorMessage(
            error,
            {
              action: editing
                ? "memperbarui"
                : "menambahkan",
              subject:
                "jadwal",
            }
          ),
      });
    }
  };

  const toggleSelectMode =
    () => {
      if (
        loading ||
        saving ||
        deletingId !== null ||
        bulkDeleting ||
        !rows.length
      ) {
        return;
      }

      setSelectedIds([]);
      setSelectMode(
        (value) => !value
      );
    };

  const toggleSelection = (
    id
  ) => {
    const key = keyOf(id);

    if (
      !key ||
      bulkDeleting
    ) {
      return;
    }

    setSelectedIds(
      (previous) =>
        previous.includes(key)
          ? previous.filter(
              (item) =>
                item !== key
            )
          : [
              ...previous,
              key,
            ]
    );
  };

  const toggleAll = () => {
    setSelectedIds(
      (previous) =>
        allVisibleSelected
          ? previous.filter(
              (id) =>
                !visibleIds.includes(
                  id
                )
            )
          : [
              ...new Set([
                ...previous,
                ...visibleIds,
              ]),
            ]
    );
  };

  const requestDelete = (
    item
  ) => {
    const classroom =
      classroomMap.get(
        keyOf(
          item.classroom_id
        )
      );

    const weekInfo =
      getWeekRange(
        dateToIsoWeek(
          text(
            item.week_start_date
          ) ||
            text(
              item.tanggal
            )
        )
      );

    setConfirm({
      type: "single",
      item,
      title: "Hapus Jadwal",
      message:
        `Jadwal ${text(classroom?.nama_kelas) || "kelas ini"} untuk minggu ${weekInfo.rangeLabel} akan dihapus.`,
    });
  };

  const requestBulkDelete =
    () => {
      if (
        !selectedIds.length
      ) {
        return;
      }

      setConfirm({
        type: "bulk",
        title:
          "Hapus Jadwal Terpilih",
        message:
          `${selectedIds.length} jadwal terpilih akan dihapus. Tindakan ini tidak dapat dibatalkan.`,
      });
    };

  const executeDelete =
    async () => {
      const target =
        confirm;

      if (!target) {
        return;
      }

      try {
        if (
          target.type ===
          "single"
        ) {
          await deleteMutation.mutateAsync(
            target.item.id
          );

          setConfirm(null);
          await invalidate();

          if (
            rows.length === 1 &&
            page > 1
          ) {
            setPage(
              (value) =>
                Math.max(
                  1,
                  value - 1
                )
            );
          }

          setNotice({
            tone: "success",
            title:
              "Jadwal Berhasil Dihapus",
            message:
              "Jadwal yang dipilih berhasil dihapus.",
          });

          return;
        }

        const ids = [
          ...selectedIds,
        ];

        const results =
          await bulkDeleteMutation.mutateAsync(
            ids
          );

        const failed =
          ids.filter(
            (_id, index) =>
              results[index]
                ?.status ===
              "rejected"
          );

        const success =
          ids.length -
          failed.length;

        setConfirm(null);
        setSelectedIds(failed);

        if (!failed.length) {
          setSelectMode(false);
        }

        await invalidate();

        if (
          success > 0 &&
          success >= rows.length &&
          page > 1
        ) {
          setPage(
            (value) =>
              Math.max(
                1,
                value - 1
              )
          );
        }

        const firstFailure =
          results.find(
            (result) =>
              result.status ===
              "rejected"
          );

        setNotice({
          tone:
            failed.length
              ? "danger"
              : "success",
          title:
            failed.length
              ? "Sebagian Jadwal Gagal Dihapus"
              : "Jadwal Berhasil Dihapus",
          message: [
            `${success} jadwal berhasil dihapus.`,
            failed.length
              ? `${failed.length} jadwal gagal dihapus.`
              : "",
            firstFailure
              ?.status ===
            "rejected"
              ? apiErrorMessage(
                  firstFailure.reason,
                  {
                    action:
                      "menghapus",
                    subject:
                      "jadwal",
                  }
                )
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch (error) {
        setConfirm(null);

        setNotice({
          tone: "danger",
          title:
            "Jadwal Gagal Dihapus",
          message:
            apiErrorMessage(
              error,
              {
                action:
                  "menghapus",
                subject:
                  "jadwal",
              }
            ),
        });
      }
    };

  const prefetchPage = (
    nextPage
  ) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    const nextParams = {
      ...params,
      page: nextPage,
    };

    queryClient.prefetchQuery({
      queryKey:
        adminQueryKeys.scheduleList(
          nextParams
        ),
      queryFn: ({ signal }) =>
        fetchSchedules({
          ...nextParams,
          signal,
        }),
      staleTime:
        SCHEDULE_STALE_TIME,
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SectionHeader
        icon={CalendarDaysIcon}
        title="Jadwal Pembelajaran"
        description="Tetapkan perencanaan pembelajaran untuk setiap kelas pada minggu pelaksanaan."
        actions={
          <>
            <span className="text-[10px] text-slate-400">
              <b className="font-semibold text-slate-600">
                {total}
              </b>{" "}
              jadwal
            </span>

            {refreshing && (
              <span className="inline-flex items-center gap-1 text-[9px] text-slate-300">
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
                Memperbarui
              </span>
            )}

            <button
              type="button"
              onClick={() =>
                setFiltersOpen(
                  (value) =>
                    !value
                )
              }
              className={`ui-toolbar-button ${
                filtersOpen ||
                filtersActive
                  ? "is-active"
                  : ""
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>

            <button
              type="button"
              onClick={
                toggleSelectMode
              }
              disabled={
                loading ||
                !rows.length
              }
              className={`ui-toolbar-button ${
                selectMode
                  ? "is-active"
                  : ""
              }`}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Pilih
            </button>

            <button
              type="button"
              onClick={() =>
                openModal()
              }
              disabled={
                loading ||
                classroomLoading ||
                saving ||
                selectMode
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Tambah Jadwal
            </button>
          </>
        }
      />

      {error && (
        <div className="mt-4 whitespace-pre-line rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-5 text-rose-700">
          {error}
        </div>
      )}

      {filtersOpen && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={
              classroomFilter
            }
            onChange={(event) =>
              setClassroomFilter(
                event.target.value
              )
            }
            disabled={
              loading ||
              selectMode ||
              classroomLoading
            }
            className="ui-compact-control min-w-52"
          >
            <option value="">
              Semua Kelas
            </option>

            {classrooms.map(
              (item) => (
                <option
                  key={keyOf(
                    item.id
                  )}
                  value={keyOf(
                    item.id
                  )}
                >
                  {text(
                    item.nama_kelas
                  ) ||
                    `Kelas #${item.id}`}
                </option>
              )
            )}
          </select>

          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

            <input
              type="text"
              value={
                searchInput
              }
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              disabled={
                selectMode
              }
              placeholder="Cari tema, pilar, nilai atau aktivitas..."
              className="ui-compact-control w-full pl-9"
            />
          </div>

          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setClassroomFilter(
                  ""
                );
                setSearchInput(
                  ""
                );
                setSearchQuery(
                  ""
                );
                setPage(1);
              }}
              className="ui-action-button"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      )}

      {selectMode && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
          <span className="text-[10px] text-slate-500">
            <b className="font-semibold text-slate-700">
              {
                selectedIds.length
              }
            </b>{" "}
            jadwal dipilih
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectMode(
                  false
                );
                setSelectedIds(
                  []
                );
              }}
              disabled={
                bulkDeleting
              }
              className="ui-action-button"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={
                requestBulkDelete
              }
              disabled={
                !selectedIds.length ||
                bulkDeleting
              }
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 text-[10px] font-semibold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Hapus (
              {
                selectedIds.length
              }
              )
            </button>
          </div>
        </div>
      )}

      <div className="ui-table-card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50/70">
              <tr>
                {selectMode && (
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={
                        allVisibleSelected
                      }
                      ref={(node) => {
                        if (node) {
                          node.indeterminate =
                            someVisibleSelected;
                        }
                      }}
                      onChange={
                        toggleAll
                      }
                      disabled={
                        bulkDeleting ||
                        !visibleIds.length
                      }
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#ef4d45] focus:ring-[#ef4d45]"
                    />
                  </th>
                )}

                <th className="w-12 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  No
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Kelas
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Minggu
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Perencanaan
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Kegiatan
                </th>

                {!selectMode && (
                  <th className="w-24 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-12 text-center"
                  >
                    <ArrowPathIcon className="mx-auto h-5 w-5 animate-spin text-slate-300" />

                    <p className="mt-2 text-[11px] text-slate-400">
                      Memuat jadwal...
                    </p>
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map(
                  (
                    item,
                    index
                  ) => {
                    const id =
                      keyOf(
                        item.id
                      );

                    const selected =
                      selectedIds.includes(
                        id
                      );

                    const deleting =
                      sameId(
                        deletingId,
                        item.id
                      );

                    const classroom =
                      classroomMap.get(
                        keyOf(
                          item.classroom_id
                        )
                      );

                    const weekDate =
                      text(
                        item.week_start_date
                      ) ||
                      text(
                        item.tanggal
                      );

                    const weekInfo =
                      getWeekRange(
                        dateToIsoWeek(
                          weekDate
                        )
                      );

                    const plan =
                      item.journal;

                    return (
                      <tr
                        key={
                          id ||
                          `${item.classroom_id}-${weekDate}`
                        }
                        className={
                          selected
                            ? "bg-rose-50/40"
                            : "hover:bg-slate-50/60"
                        }
                      >
                        {selectMode && (
                          <td className="px-3 py-2.5 text-center align-top">
                            <input
                              type="checkbox"
                              checked={
                                selected
                              }
                              onChange={() =>
                                toggleSelection(
                                  item.id
                                )
                              }
                              disabled={
                                bulkDeleting ||
                                !id
                              }
                              className="h-3.5 w-3.5 rounded border-slate-300 text-[#ef4d45] focus:ring-[#ef4d45]"
                            />
                          </td>
                        )}

                        <td className="px-3 py-2.5 align-top text-[11px] text-slate-400">
                          {(page - 1) *
                            ITEMS_PER_PAGE +
                            index +
                            1}
                        </td>

                        <td className="px-3 py-2.5 align-top">
                          <p className="text-[11px] font-semibold text-slate-700">
                            {text(
                              classroom
                                ?.nama_kelas
                            ) ||
                              `Kelas #${item.classroom_id ?? "-"}`}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            ID{" "}
                            {item.classroom_id ??
                              "-"}
                          </p>
                        </td>

                        <td className="px-3 py-2.5 align-top">
                          <p className="text-[11px] font-semibold text-slate-700">
                            Minggu{" "}
                            {
                              weekInfo.weekNumber
                            }
                          </p>

                          <p className="mt-0.5 whitespace-nowrap text-[10px] text-slate-400">
                            {
                              weekInfo.rangeLabel
                            }
                          </p>
                        </td>

                        <td className="max-w-xs px-3 py-2.5 align-top">
                          {plan ? (
                            <>
                              <p className="text-[11px] font-semibold text-slate-700">
                                {text(
                                  plan.tema
                                ) ||
                                  "Tanpa Tema"}
                              </p>

                              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                                Pilar:{" "}
                                {text(
                                  plan.pilar_karakter
                                ) ||
                                  "-"}
                              </p>

                              <p className="text-[10px] leading-4 text-slate-400">
                                Nilai:{" "}
                                {text(
                                  plan.nilai_karakter
                                ) ||
                                  "-"}
                              </p>
                            </>
                          ) : (
                            <span className="text-[10px] italic text-rose-500">
                              Perencanaan
                              tidak
                              tersedia
                            </span>
                          )}
                        </td>

                        <td className="max-w-sm px-3 py-2.5 align-top">
                          {plan ? (
                            <>
                              <p className="text-[11px] leading-4 text-slate-600">
                                {text(
                                  plan.aktivitas
                                ) ||
                                  "-"}
                              </p>

                              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                                Pembiasaan:{" "}
                                {text(
                                  plan.pembiasaan
                                ) ||
                                  "-"}
                              </p>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              -
                            </span>
                          )}
                        </td>

                        {!selectMode && (
                          <td className="px-3 py-2.5 text-right align-top">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openModal(
                                    item
                                  )
                                }
                                disabled={
                                  deletingId !==
                                  null
                                }
                                className="ui-action-button"
                                title="Edit jadwal"
                              >
                                <PencilSquareIcon className="h-3.5 w-3.5" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  requestDelete(
                                    item
                                  )
                                }
                                disabled={
                                  deletingId !==
                                  null
                                }
                                className="inline-flex h-8 items-center justify-center rounded-lg px-2 text-[10px] font-semibold text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Hapus jadwal"
                              >
                                {deleting ? (
                                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <TrashIcon className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-12 text-center text-[11px] text-slate-400"
                  >
                    {filtersActive
                      ? "Data jadwal tidak ditemukan."
                      : "Belum ada jadwal yang diatur."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-slate-400">
            Menampilkan{" "}
            {rows.length} dari{" "}
            {total} jadwal
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onPointerEnter={() =>
                prefetchPage(
                  page - 1
                )
              }
              onFocus={() =>
                prefetchPage(
                  page - 1
                )
              }
              onClick={() =>
                setPage(
                  (value) =>
                    Math.max(
                      1,
                      value - 1
                    )
                )
              }
              disabled={
                page === 1 ||
                loading ||
                selectMode
              }
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-14 text-center text-[10px] font-medium text-slate-500">
              {page} /{" "}
              {totalPages}
            </span>

            <button
              type="button"
              onPointerEnter={() =>
                prefetchPage(
                  page + 1
                )
              }
              onFocus={() =>
                prefetchPage(
                  page + 1
                )
              }
              onClick={() =>
                setPage(
                  (value) =>
                    Math.min(
                      totalPages,
                      value + 1
                    )
                )
              }
              disabled={
                page ===
                  totalPages ||
                loading ||
                selectMode
              }
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-[1px]"
          onMouseDown={
            closeModal
          }
        >
          <section
            role="dialog"
            aria-modal="true"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {editing
                    ? "Edit Jadwal"
                    : "Tambah Jadwal"}
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Satu kelas
                  hanya memiliki
                  satu
                  perencanaan
                  untuk satu
                  minggu.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </header>

            <form
              onSubmit={save}
              className="overflow-y-auto"
            >
              <div className="min-h-[300px] space-y-4 px-5 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Kelas
                    </span>

                    <select
                      required
                      value={
                        form.classroom_id
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "classroom_id",
                          event
                            .target
                            .value
                        )
                      }
                      disabled={
                        saving ||
                        classroomLoading
                      }
                      className="ui-compact-control w-full"
                    >
                      <option value="">
                        Pilih Kelas
                      </option>

                      {!editing &&
                        classrooms.length >
                          0 && (
                          <option
                            value={
                              ALL_CLASSROOMS_VALUE
                            }
                          >
                            Semua
                            Kelas
                          </option>
                        )}

                      {classrooms.map(
                        (
                          item
                        ) => (
                          <option
                            key={keyOf(
                              item.id
                            )}
                            value={keyOf(
                              item.id
                            )}
                          >
                            {text(
                              item.nama_kelas
                            ) ||
                              `Kelas #${item.id}`}
                          </option>
                        )
                      )}
                    </select>

                    {!editing &&
                      form.classroom_id ===
                        ALL_CLASSROOMS_VALUE && (
                        <span className="mt-1 block text-[10px] leading-4 text-slate-400">
                          Jadwal
                          dibuat
                          untuk
                          semua
                          kelas yang
                          belum
                          memiliki
                          jadwal pada
                          minggu
                          terpilih.
                        </span>
                      )}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Minggu
                      Pelaksanaan
                    </span>

                    <input
                      type="week"
                      required
                      value={
                        form.minggu
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "minggu",
                          event
                            .target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                      className="ui-compact-control w-full"
                    />

                    {form.minggu && (
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {
                          getWeekRange(
                            form.minggu
                          )
                            .rangeLabel
                        }
                      </span>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Perencanaan
                    Pembelajaran
                  </span>

                  <select
                    required
                    value={
                      form.journal_id
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "journal_id",
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      saving ||
                      journalLoading ||
                      journalQuery.isError
                    }
                    className="ui-compact-control w-full"
                  >
                    <option value="">
                      {journalLoading
                        ? "Memuat perencanaan..."
                        : "Pilih Perencanaan"}
                    </option>

                    {groupedJournals.map(
                      (group) => (
                        <optgroup
                          key={
                            group.theme
                          }
                          label={
                            group.theme
                          }
                        >
                          {group.journals.map(
                            (
                              journal
                            ) => (
                              <option
                                key={keyOf(
                                  journal.id
                                )}
                                value={keyOf(
                                  journal.id
                                )}
                              >
                                Pilar:{" "}
                                {journal.pilar_karakter ||
                                  "-"}{" "}
                                · Nilai:{" "}
                                {journal.nilai_karakter ||
                                  "-"}
                              </option>
                            )
                          )}
                        </optgroup>
                      )
                    )}
                  </select>
                </label>

                {selectedJournal && (
                  <div className="grid grid-cols-1 gap-x-5 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <Meta
                      label="Tema"
                      value={
                        selectedJournal.tema
                      }
                    />

                    <Meta
                      label="Pilar Karakter"
                      value={
                        selectedJournal.pilar_karakter
                      }
                    />

                    <Meta
                      label="Nilai Karakter"
                      value={
                        selectedJournal.nilai_karakter
                      }
                    />

                    <Meta
                      label="Pembiasaan"
                      value={
                        selectedJournal.pembiasaan
                      }
                    />

                    <div className="sm:col-span-2">
                      <Meta
                        label="Aktivitas"
                        value={
                          selectedJournal.aktivitas
                        }
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Meta
                        label="Jurnal"
                        value={
                          selectedJournal.isi_jurnal
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="ui-action-button"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    masterLoading ||
                    !classrooms.length ||
                    !journals.length
                  }
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#ef4d45] px-4 text-[10px] font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  )}

                  {saving
                    ? "Menyimpan..."
                    : "Simpan"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <ConfirmModal
        confirm={confirm}
        busy={
          deleteMutation.isPending ||
          bulkDeleting
        }
        onCancel={() =>
          setConfirm(null)
        }
        onConfirm={
          executeDelete
        }
      />

      <NoticeModal
        notice={notice}
        onClose={() =>
          setNotice(null)
        }
      />
    </div>
  );
}
