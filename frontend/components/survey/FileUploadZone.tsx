"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toastService } from "@/lib/toast-service";
import { cn, formatBytes, isPdfFile } from "@/lib/utils";

type UploadEntry = {
  file: File;
  progress: number;
};

export function FileUploadZone({
  files,
  onChange,
  multiple = false,
  maxFileSizeMb = 1,
  className
}: {
  files: File[];
  onChange: (files: File[]) => void;
  multiple?: boolean;
  maxFileSizeMb?: number;
  className?: string;
}) {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const fileEntries = useMemo<UploadEntry[]>(
    () => files.map((file) => ({ file, progress: progressMap[`${file.name}-${file.lastModified}`] ?? 100 })),
    [files, progressMap]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    accept: { "application/pdf": [".pdf"] },
    onDrop: (accepted, rejected) => {
      const nextFiles = multiple ? [...files, ...accepted] : accepted.slice(0, 1);
      if (nextFiles.length > 0) {
        onChange(nextFiles);
      }

      rejected.forEach((rejection) => {
        const file = rejection.file;
        const hasFormatError = rejection.errors.some((error) => error.code === "file-invalid-type");
        const hasSizeError = rejection.errors.some((error) => error.code === "file-too-large");

        if (hasSizeError) {
          toastService.error("File too large", `${file.name} exceeds the 1MB limit. Please compress or use a smaller file.`);
        } else if (hasFormatError) {
          toastService.error("Invalid file type", "Only PDF files are accepted for certificate uploads.");
        }
      });
    },
    maxSize: maxFileSizeMb * 1024 * 1024
  });

  useEffect(() => {
    const next = Object.fromEntries(files.map((file) => [`${file.name}-${file.lastModified}`, 0]));
    setProgressMap((current) => ({ ...current, ...next }));
  }, [files]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgressMap((current) => {
        let changed = false;
        const next = { ...current };
        for (const key of Object.keys(next)) {
          if (next[key] < 100) {
            next[key] = Math.min(100, next[key] + 20);
            changed = true;
          }
        }
        return changed ? next : current;
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, []);

  const removeFile = (name: string, lastModified: number) => {
    onChange(files.filter((file) => `${file.name}-${file.lastModified}` !== `${name}-${lastModified}`));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "focus-ring cursor-pointer rounded-3xl border border-dashed px-6 py-8 text-center transition",
          isDragActive
            ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.12)] shadow-[0_0_0_1px_rgba(13,148,136,0.2),0_0_24px_rgba(13,148,136,0.08)]"
            : "border-[color:var(--border)] bg-[color:var(--bg-surface)] hover:border-[color:var(--border-active)] hover:bg-[color:var(--bg-subtle)]"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-7 w-7 text-[color:var(--primary)]" />
        <div className="mt-3 font-medium text-[color:var(--text-primary)]">
          {isDragActive ? "Drop files here" : "Drag PDF certificates here"}
        </div>
        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
          {multiple ? "You can add more than one PDF file." : "One PDF file at a time."} Max {maxFileSizeMb}MB each.
        </p>
      </div>

      <AnimatePresence>
        {fileEntries.length > 0 ? (
          <div className="space-y-3">
            {fileEntries.map(({ file, progress }) => (
              <motion.div
                key={`${file.name}-${file.lastModified}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-2 text-[color:var(--primary)]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[color:var(--text-primary)]">{file.name}</div>
                    <div className="mt-1 text-xs text-[color:var(--text-secondary)]">{formatBytes(file.size)}</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-[color:var(--primary)] transition-[width] duration-75"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.name, file.lastModified)}
                    className="focus-ring rounded-full p-2 text-[color:var(--text-muted)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
