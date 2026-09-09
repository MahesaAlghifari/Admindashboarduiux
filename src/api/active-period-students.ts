import {
    fetchCurrentAcademicPeriod,
    type AcademicPeriod,
} from "./academic-periods";
import {
    fetchAllClassrooms,
    type Classroom,
} from "./classrooms";
import {
    fetchStudentById,
    fetchStudents,
    type Student,
} from "./students";
import {
    fetchStudentUsers,
    type StudentUser,
} from "./users";

export type ActivePeriodStudentId =
    number | string;

export interface ActivePeriodStudent {
    id: ActivePeriodStudentId;
    nama_lengkap: string;
    nisn: string;
    nik: string;
    jenis_kelamin: string;
    foto: string;
    classroom_id:
        | ActivePeriodStudentId
        | null;
    classroom_name: string;
    status_aktif: true;
    tahun_pelajaran: string;
    tanggal_masuk: string;
    tanggal_keluar: string;
    kelompok_umur: string;
    berat_badan: number | null;
    tinggi_badan: number | null;
}

export interface ActivePeriodStudentsOptions {
    period?: AcademicPeriod | null;
    classrooms?: Classroom[] | null;
    classroom_id?:
        | ActivePeriodStudentId
        | "all"
        | null;
    q?: string;
    requireClassroom?: boolean;
    includeDevelopment?: boolean;
    signal?: AbortSignal;
}

interface StudentPlacement {
    id: ActivePeriodStudentId;
    nama_lengkap: string;
    nisn: string;
    nik: string;
    classroom_id:
        | ActivePeriodStudentId
        | null;
    classroom_name: string;
    tahun_ajaran: string;
}

interface StudentSummaryRow {
    id: ActivePeriodStudentId;
    nama_lengkap: string;
    nisn: string;
    nik: string;
    jenis_kelamin: string;
    foto: string;
    status_aktif: boolean;
    tahun_pelajaran: string;
    tanggal_masuk: string;
    tanggal_keluar: string;
    kelompok_umur: string;
}

const text = (value: unknown) =>
    String(value ?? "").trim();

const keyOf = (value: unknown) =>
    String(value ?? "");

const numberOrNull = (
    value: unknown
): number | null => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : null;
};

function classroomMap(
    classrooms: Classroom[]
) {
    return new Map(
        classrooms
            .filter(
                (classroom) =>
                    classroom.id !== null
            )
            .map((classroom) => [
                keyOf(classroom.id),
                classroom,
            ])
    );
}

function normalizePlacement(
    user: StudentUser,
    classrooms: Map<
        string,
        Classroom
    >
): StudentPlacement | null {
    if (
        user.id === null ||
        !user.status_aktif
    ) {
        return null;
    }

    const classroom =
        user.classroom_id !== null
            ? classrooms.get(
                  keyOf(
                      user.classroom_id
                  )
              )
            : undefined;

    return {
        id: user.id,
        nama_lengkap:
            text(user.nama_lengkap),
        nisn: text(user.nisn),
        nik: text(user.nik),
        classroom_id:
            user.classroom_id,
        classroom_name:
            text(
                classroom?.nama_kelas
            ) ||
            text(user.nama_kelas),
        tahun_ajaran: text(
            classroom
                ?.curriculum
                ?.tahun_ajaran
        ),
    };
}

function classroomPlacements(
    classrooms: Classroom[]
): StudentPlacement[] {
    const output: StudentPlacement[] = [];

    classrooms.forEach((classroom) => {
        if (classroom.id === null) {
            return;
        }

        const classroomId = classroom.id;
        const classroomName = text(classroom.nama_kelas);
        const schoolYear = text(classroom.curriculum?.tahun_ajaran);

        (classroom.students ?? []).forEach((student) => {
            if (student.id === null) {
                return;
            }

            output.push({
                id: student.id,
                nama_lengkap: text(student.nama_lengkap),
                nisn: text(student.nisn),
                nik: "",
                classroom_id: classroomId,
                classroom_name: classroomName,
                tahun_ajaran: schoolYear,
            });
        });
    });

    return output;
}

function normalizeSummary(
    student: Student
): StudentSummaryRow | null {
    if (
        student.id === null ||
        !student.status.status_aktif
    ) {
        return null;
    }

    return {
        id: student.id,
        nama_lengkap:
            text(
                student.nama_lengkap
            ),
        nisn: text(student.nisn),
        nik: text(student.nik),
        jenis_kelamin:
            text(
                student.jenis_kelamin
            ),
        foto: text(student.foto),
        status_aktif:
            student.status.status_aktif,
        tahun_pelajaran:
            text(
                student.status
                    .tahun_pelajaran
            ),
        tanggal_masuk:
            text(
                student.status
                    .tanggal_masuk
            ),
        tanggal_keluar:
            text(
                student.status
                    .tanggal_keluar
            ),
        kelompok_umur:
            text(
                student.status
                    .kelompok_umur
            ),
    };
}

function placementResolver(
    placements: StudentPlacement[]
) {
    const byId = new Map<
        string,
        StudentPlacement
    >();

    const byNisn = new Map<
        string,
        StudentPlacement
    >();

    const byNik = new Map<
        string,
        StudentPlacement
    >();

    placements.forEach(
        (placement) => {
            byId.set(
                keyOf(placement.id),
                placement
            );

            if (placement.nisn) {
                byNisn.set(
                    placement.nisn,
                    placement
                );
            }

            if (placement.nik) {
                byNik.set(
                    placement.nik,
                    placement
                );
            }
        }
    );

    return (
        summary: StudentSummaryRow
    ) =>
        byId.get(
            keyOf(summary.id)
        ) ||
        (summary.nisn
            ? byNisn.get(
                  summary.nisn
              )
            : undefined) ||
        (summary.nik
            ? byNik.get(
                  summary.nik
              )
            : undefined) ||
        null;
}

async function settleDetails(
    students: StudentSummaryRow[],
    signal?: AbortSignal
) {
    const results = new Map<
        string,
        Student
    >();

    if (!students.length) {
        return results;
    }

    let cursor = 0;

    const concurrency = Math.min(
        4,
        students.length
    );

    const worker = async () => {
        while (true) {
            const index = cursor;
            cursor += 1;

            if (
                index >=
                students.length
            ) {
                return;
            }

            const student =
                students[index];

            try {
                const detail =
                    await fetchStudentById(
                        student.id,
                        signal
                    );

                results.set(
                    keyOf(student.id),
                    detail
                );
            } catch {
                if (signal?.aborted) {
                    return;
                }
            }
        }
    };

    await Promise.all(
        Array.from(
            {
                length: concurrency,
            },
            () => worker()
        )
    );

    return results;
}

function matchesQuery(
    student: ActivePeriodStudent,
    query: string
) {
    if (!query) {
        return true;
    }

    return [
        student.nama_lengkap,
        student.nisn,
        student.nik,
        student.classroom_name,
    ]
        .map((value) =>
            value.toLocaleLowerCase(
                "id-ID"
            )
        )
        .some((value) =>
            value.includes(query)
        );
}

export async function fetchActivePeriodStudents(
    options:
        ActivePeriodStudentsOptions = {}
): Promise<ActivePeriodStudent[]> {
    const signal = options.signal;

    const period =
        options.period ??
        (await fetchCurrentAcademicPeriod(
            signal
        ));

    const activeYear = text(
        period?.tahun_ajaran
    );

    if (!activeYear) {
        throw new Error(
            "Periode akademik aktif belum tersedia. Aktifkan periode akademik terlebih dahulu."
        );
    }

    const requireClassroom =
        options.requireClassroom !==
        false;

    const [
        users,
        classrooms,
        students,
    ] = await Promise.all([
        requireClassroom
            ? Promise.resolve([] as StudentUser[])
            : fetchStudentUsers({
                  status_aktif: true,
                  signal,
              }),
        options.classrooms
            ? Promise.resolve(options.classrooms)
            : fetchAllClassrooms(
                  100,
                  signal
              ),
        fetchStudents({
            status_aktif: true,
            signal,
        }),
    ]);

    const classes =
        classroomMap(classrooms);

    // User directory can lag behind classroom membership.  Keep active-user
    // placements for unassigned students, then let /api/classrooms override
    // the classroom relation because that endpoint is the source used by
    // Administrasi → Data Kelas.
    const placements = [
        ...users
            .map((user) =>
                normalizePlacement(
                    user,
                    classes
                )
            )
            .filter(
                (
                    value
                ): value is StudentPlacement =>
                    value !== null
            ),
        ...classroomPlacements(classrooms),
    ];

    const summaries = students
        .map(normalizeSummary)
        .filter(
            (
                value
            ): value is StudentSummaryRow =>
                value !== null
        );

    const resolvePlacement =
        placementResolver(
            placements
        );

    const classroomFilter =
        options.classroom_id;

    const query = text(
        options.q
    ).toLocaleLowerCase("id-ID");

    const candidates = summaries
        .map((summary) => ({
            summary,
            placement:
                resolvePlacement(
                    summary
                ),
        }))
        .filter(
            (
                item
            ): item is {
                summary: StudentSummaryRow;
                placement: StudentPlacement;
            } =>
                item.placement !==
                null
        )
        .filter((item) => {
            const placement =
                item.placement;

            if (
                requireClassroom &&
                placement.classroom_id ===
                    null
            ) {
                return false;
            }

            if (
                classroomFilter !==
                    undefined &&
                classroomFilter !== null &&
                classroomFilter !==
                    "all" &&
                keyOf(
                    placement.classroom_id
                ) !==
                    keyOf(
                        classroomFilter
                    )
            ) {
                return false;
            }

            // Do not hide an otherwise active student just because legacy
            // classroom/student metadata still contains a previous school
            // year. The active period controls dates and reporting context;
            // current active status + current classroom membership control
            // whether the student is operationally visible.
            return true;
        });

    // Initial Kegiatan lists only need active identity + current classroom.
    // Do not fan out into /students/{id} just because legacy placement metadata
    // lacks a school year; detail data is fetched only when explicitly requested.
    const detailsNeeded = options.includeDevelopment
        ? candidates.map((item) => item.summary)
        : [];

    const details =
        await settleDetails(
            detailsNeeded,
            signal
        );

    const output: ActivePeriodStudent[] =
        [];

    candidates.forEach(
        ({ summary, placement }) => {
            const detail =
                details.get(
                    keyOf(summary.id)
                );

            // Operational student lists always follow the active academic
            // period. Stored student/classroom years are historical metadata
            // and must not make an active student appear in an old period.
            const schoolYear = activeYear;

            if (
                detail &&
                !detail.status
                    .status_aktif
            ) {
                return;
            }

            const student: ActivePeriodStudent =
                {
                    id:
                        detail?.id ??
                        summary.id,
                    nama_lengkap:
                        text(
                            detail
                                ?.nama_lengkap
                        ) ||
                        summary.nama_lengkap ||
                        placement.nama_lengkap,
                    nisn:
                        text(
                            detail?.nisn
                        ) ||
                        summary.nisn ||
                        placement.nisn,
                    nik:
                        text(
                            detail?.nik
                        ) ||
                        summary.nik ||
                        placement.nik,
                    jenis_kelamin:
                        text(
                            detail
                                ?.jenis_kelamin
                        ) ||
                        summary.jenis_kelamin,
                    foto:
                        text(
                            detail?.foto
                        ) ||
                        summary.foto,
                    classroom_id:
                        placement.classroom_id,
                    classroom_name:
                        placement.classroom_name,
                    status_aktif: true,
                    tahun_pelajaran:
                        schoolYear,
                    tanggal_masuk:
                        text(
                            detail
                                ?.status
                                .tanggal_masuk
                        ) ||
                        summary.tanggal_masuk,
                    tanggal_keluar:
                        text(
                            detail
                                ?.status
                                .tanggal_keluar
                        ) ||
                        summary.tanggal_keluar,
                    kelompok_umur:
                        text(
                            detail
                                ?.status
                                .kelompok_umur
                        ) ||
                        summary.kelompok_umur,
                    berat_badan:
                        detail
                            ? numberOrNull(
                                  detail
                                      .dev
                                      .berat_badan
                              )
                            : null,
                    tinggi_badan:
                        detail
                            ? numberOrNull(
                                  detail
                                      .dev
                                      .tinggi_badan
                              )
                            : null,
                };

            if (
                matchesQuery(
                    student,
                    query
                )
            ) {
                output.push(student);
            }
        }
    );

    return output.sort(
        (left, right) =>
            left.nama_lengkap.localeCompare(
                right.nama_lengkap,
                "id",
                {
                    sensitivity:
                        "base",
                    numeric: true,
                }
            )
    );
}
