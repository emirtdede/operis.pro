import { NextResponse } from "next/server";
import { getSession } from "@/src/modules/auth/session";
import { evaluateSecurityAccessAsync, getClientIp } from "@/src/lib/security/rate-limit";
import {
  enqueueExportJob,
  getExportJobStatus,
  cancelExportJob,
} from "@/src/modules/privacy/export-jobs";
import { readAndVerifyExportPartsStream } from "@/src/modules/privacy/export-writer";
import { ExportError } from "@/src/modules/privacy/export-errors";

function getSafeExportError(
  err: unknown,
  isEn: boolean
): { error: string; errorCode: string; status: number } {
  if (err instanceof ExportError) {
    const errorMap: Record<string, { en: string; tr: string }> = {
      USER_NOT_FOUND: {
        en: "User account not found.",
        tr: "Kullanıcı hesabı bulunamadı.",
      },
      EXPORT_ALREADY_ACTIVE: {
        en: "An export job is already active for this account.",
        tr: "Bu hesap için zaten devam eden aktif bir veri aktarım işi bulunmaktadır.",
      },
      EXPORT_JOB_NOT_FOUND: {
        en: "Export job not found.",
        tr: "Belirtilen veri aktarım işi bulunamadı.",
      },
      EXPORT_CANNOT_CANCEL: {
        en: "The export job cannot be cancelled in its current state.",
        tr: "Veri aktarım işi mevcut durumunda iptal edilemez.",
      },
      EXPORT_EXPIRED: {
        en: "The export package has expired.",
        tr: "Veri aktarım paketinin süresi dolmuştur.",
      },
      EXPORT_NOT_READY: {
        en: "Export package is not ready for download yet.",
        tr: "Veri aktarım paketi henüz indirilmeye hazır değil.",
      },
      EXPORT_CHECKSUM_MISMATCH: {
        en: "Export package integrity verification failed.",
        tr: "Veri aktarım paketinin bütünlük doğrulaması başarısız oldu.",
      },
      EXPORT_PART_MISSING: {
        en: "Export package parts are incomplete or missing.",
        tr: "Veri aktarım parçaları eksik veya tamamlanmamış.",
      },
      EXPORT_PART_CORRUPT: {
        en: "Export package data is corrupted.",
        tr: "Veri aktarım paketi verisi bozuk.",
      },
      EXPORT_DECRYPTION_FAILED: {
        en: "Failed to decrypt export package.",
        tr: "Veri aktarım paketi şifresi çözülemedi.",
      },
      EXPORT_IDENTITY_DECRYPTION_FAILED: {
        en: "Failed to decrypt personal data.",
        tr: "Kişisel veri şifresi çözülemedi.",
      },
      EXPORT_EMAIL_DECRYPTION_FAILED: {
        en: "Failed to decrypt account email.",
        tr: "Hesap e-posta şifresi çözülemedi.",
      },
      EXPORT_TIMEOUT: {
        en: "Export process timed out.",
        tr: "Veri aktarım işlemi zaman aşımına uğradı.",
      },
      EXPORT_ABORTED: {
        en: "Export process was aborted.",
        tr: "Veri aktarım işlemi durduruldu.",
      },
    };

    const mapped = errorMap[err.code];
    let errorMessage = isEn
      ? "An export processing error occurred."
      : "Veri aktarım işleminde bir hata oluştu.";
    if (mapped) {
      errorMessage = isEn ? mapped.en : mapped.tr;
    }
    return {
      error: errorMessage,
      errorCode: err.code,
      status: err.status,
    };
  }

  return {
    error: isEn
      ? "An internal server error occurred while processing export."
      : "Veri aktarımı işlenirken bir sunucu hatası oluştu.",
    errorCode: "INTERNAL_EXPORT_ERROR",
    status: 500,
  };
}

/**
 * B26: POST initiates an asynchronous, persistent data export job (202 Accepted).
 * Strictly enqueues an export job in PostgreSQL with no synchronous generation fallback.
 */
export async function POST(req: Request) {
  const headerLocale = req.headers.get("x-locale");
  const isEn = headerLocale === "en";
  const ip = getClientIp(req);

  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const security = await evaluateSecurityAccessAsync({
      ip,
      purpose: "account:export:post",
      subject: session.userId,
      limit: 5,
      windowMs: 60 * 60 * 1000,
      isEn,
    });
    if (!security.allowed) {
      return security.response;
    }

    const enqueued = await enqueueExportJob(session.userId);

    if (enqueued.alreadyRunning) {
      return NextResponse.json(
        {
          error: isEn
            ? "An export is already running or ready for download. Please download it or wait for it to expire."
            : "Zaten devam eden veya indirilmeye hazır bir veri aktarım işi bulunmaktadır.",
          errorCode: "EXPORT_ALREADY_ACTIVE",
          jobId: enqueued.jobId,
          status: enqueued.status,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        jobId: enqueued.jobId,
        status: enqueued.status,
        alreadyRunning: false,
        pollAfterSeconds: enqueued.pollAfterSeconds,
        message: isEn
          ? `Export job initiated. Check status with GET /api/account/export?jobId=${enqueued.jobId}`
          : `Veri aktarım işi başlatıldı. GET /api/account/export?jobId=${enqueued.jobId} ile durumu sorgulayabilirsiniz.`,
      },
      { status: 202 }
    );
  } catch (err: unknown) {
    const safe = getSafeExportError(err, isEn);
    return NextResponse.json(
      { error: safe.error, errorCode: safe.errorCode },
      { status: safe.status }
    );
  }
}

/**
 * B26: GET polls job status or downloads decrypted parts as a stream.
 * Verified checksum on exact downloaded stream and enforced 24-hour expiration.
 */
export async function GET(req: Request) {
  const headerLocale = req.headers.get("x-locale");
  const isEn = headerLocale === "en";
  const ip = getClientIp(req);

  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const security = await evaluateSecurityAccessAsync({
      ip,
      purpose: "account:export:get",
      subject: session.userId,
      limit: 30,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!security.allowed) {
      return security.response;
    }

    const url = new URL(req.url);
    const requestedJobId = url.searchParams.get("jobId") || undefined;
    const isDownload = url.searchParams.get("download") === "1";

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (requestedJobId && !UUID_REGEX.test(requestedJobId)) {
      return NextResponse.json(
        {
          error: isEn
            ? "Invalid jobId format. Must be a valid UUID."
            : "Geçersiz jobId formatı. Geçerli bir UUID olmalıdır.",
          errorCode: "INVALID_JOB_ID",
        },
        { status: 400 }
      );
    }

    const job = await getExportJobStatus(session.userId, requestedJobId);

    if (!job) {
      return NextResponse.json(
        {
          error: isEn ? "Export job not found." : "Belirtilen veri aktarım işi bulunamadı.",
          errorCode: "EXPORT_JOB_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // 1. Status poll mode (download != 1)
    if (!isDownload) {
      const downloadUrl =
        job.status === "READY"
          ? `/api/account/export?jobId=${encodeURIComponent(job.id)}&download=1`
          : null;

      const jobDto = {
        id: job.id,
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        progressPercent: job.progress,
        partCount: job.partCount,
        fileSizeBytes: job.fileSizeBytes,
        checksumSha256: job.checksumSha256,
        sha256Checksum: job.checksumSha256,
        downloadUrl,
        expiresAt: job.expiresAt ? job.expiresAt.toISOString() : null,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt ? job.completedAt.toISOString() : null,
      };

      let pendingMessage: string | undefined;
      if (job.status === "PENDING" || job.status === "PROCESSING") {
        pendingMessage = isEn
          ? "Export package is being generated. Please wait."
          : "Veri aktarım paketi hazırlanıyor. Lütfen bekleyiniz.";
      }

      return NextResponse.json({
        ...jobDto,
        job: jobDto,
        message: pendingMessage,
      });
    }

    // 2. Stream download mode (download=1)
    if (job.status === "EXPIRED") {
      return NextResponse.json(
        {
          error: isEn
            ? "The export package has expired. Please request a new export."
            : "Veri aktarım paketinin süresi dolmuştur. Lütfen yeni bir aktarım talep ediniz.",
          errorCode: "EXPORT_EXPIRED",
        },
        { status: 410 }
      );
    }

    if (job.status !== "READY") {
      return NextResponse.json(
        {
          error: isEn
            ? "Export package is not ready for download yet."
            : "Veri aktarım paketi henüz indirilmeye hazır değil.",
          errorCode: "EXPORT_NOT_READY",
          status: job.status,
        },
        { status: 400 }
      );
    }

    if (!job.resultAttempt || !job.checksumSha256) {
      return NextResponse.json(
        {
          error: isEn
            ? "Export job metadata is corrupted."
            : "Veri aktarım işi meta verileri eksik veya bozuk.",
          errorCode: "EXPORT_METADATA_CORRUPT",
        },
        { status: 500 }
      );
    }

    // Stream decrypted parts via ReadableStream directly as raw bytes with cancel cleanup
    const partsGenerator = readAndVerifyExportPartsStream(
      job.id,
      job.resultAttempt,
      job.checksumSha256,
      job.partCount ?? undefined
    );

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const next = await partsGenerator.next();
          if (next.done) {
            controller.close();
          } else {
            controller.enqueue(new Uint8Array(next.value));
          }
        } catch (streamErr) {
          controller.error(streamErr);
        }
      },
      async cancel() {
        await partsGenerator.return();
      },
    });

    const filename = `operis-data-export-${job.id}.json`;

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Export-Checksum": job.checksumSha256,
        "X-Export-Expires-At": job.expiresAt ? job.expiresAt.toISOString() : "",
        "X-Export-Job-Id": job.id,
      },
    });
  } catch (err: unknown) {
    const safe = getSafeExportError(err, isEn);
    return NextResponse.json(
      { error: safe.error, errorCode: safe.errorCode },
      { status: safe.status }
    );
  }
}

/**
 * B26: DELETE cancels an active export job and cleans up partial parts.
 */
export async function DELETE(req: Request) {
  const headerLocale = req.headers.get("x-locale");
  const isEn = headerLocale === "en";
  const ip = getClientIp(req);

  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json(
        { error: isEn ? "Unauthorized. Please sign in." : "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const security = await evaluateSecurityAccessAsync({
      ip,
      purpose: "account:export:delete",
      subject: session.userId,
      limit: 10,
      windowMs: 60 * 1000,
      isEn,
    });
    if (!security.allowed) {
      return security.response;
    }

    const url = new URL(req.url);
    const requestedJobId = url.searchParams.get("jobId") || undefined;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (requestedJobId && !UUID_REGEX.test(requestedJobId)) {
      return NextResponse.json(
        {
          error: isEn
            ? "Invalid jobId format. Must be a valid UUID."
            : "Geçersiz jobId formatı. Geçerli bir UUID olmalıdır.",
          errorCode: "INVALID_JOB_ID",
        },
        { status: 400 }
      );
    }

    await cancelExportJob(session.userId, requestedJobId);

    return NextResponse.json({
      success: true,
      message: isEn
        ? "Export job cancelled successfully."
        : "Veri aktarım işi başarıyla iptal edildi.",
    });
  } catch (err: unknown) {
    const safe = getSafeExportError(err, isEn);
    return NextResponse.json(
      { error: safe.error, errorCode: safe.errorCode },
      { status: safe.status }
    );
  }
}
