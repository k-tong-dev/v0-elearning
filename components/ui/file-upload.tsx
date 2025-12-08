"use client";

import { cn } from "@/utils/utils";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, FileIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "./button";

export interface FileUploadFile {
  file: File;
  id: string;
  uploadProgress?: number;
  uploadStatus?: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export interface FileUploadProps {
  onChange?: (files: File[]) => void;
  onFileAdd?: (file: File) => void;
  onFileRemove?: (file: File) => void;
  accept?: string | Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  showFileList?: boolean;
  showFileDetails?: boolean;
  placeholder?: string;
  description?: string;
  value?: File[];
  onUpload?: (file: File) => Promise<string | null>; // Optional upload function that returns URL or null
  showUploadProgress?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.startsWith("video/")) return "🎥";
  if (fileType.startsWith("audio/")) return "🎵";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "📊";
  return "📎";
};

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
  onFileAdd,
  onFileRemove,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled = false,
  className,
  showFileList = true,
  showFileDetails = true,
  placeholder = "Upload file",
  description = "Drag or drop your files here or click to upload",
  value,
  onUpload,
  showUploadProgress = false,
}: FileUploadProps) => {
  const [files, setFiles] = useState<FileUploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with external value prop
  useEffect(() => {
    if (value) {
      // Filter out non-File objects (like strings, numbers, etc.)
      const validFiles = value.filter((item): item is File => item instanceof File);
      
      if (validFiles.length > 0) {
        const newFiles = validFiles.map((file) => ({
          file,
          id: `${file.name}-${file.size}-${file.lastModified}`,
          uploadStatus: "pending" as const,
        }));
        setFiles(newFiles);
      } else {
        // If no valid files, clear the files array
        setFiles([]);
      }
    } else {
      setFiles([]);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)} limit`;
    }
    return null;
  };

  const handleFileAdd = useCallback(
    async (newFiles: File[]) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
          continue;
        }

        if (maxFiles && files.length + validFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} file(s) allowed`);
          break;
        }

        validFiles.push(file);
      }

      if (errors.length > 0) {
        console.error("File validation errors:", errors);
        // You can add toast notifications here if needed
      }

      if (validFiles.length === 0) return;

      const newFileItems: FileUploadFile[] = validFiles.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${file.lastModified}`,
        uploadStatus: "pending" as const,
      }));

      setFiles((prevFiles) => {
        const updated = multiple ? [...prevFiles, ...newFileItems] : newFileItems;
        return updated;
      });

      // Call callbacks
      validFiles.forEach((file) => {
        onFileAdd?.(file);
      });

      if (onChange) {
        const allFiles = multiple ? [...files.map((f) => f.file), ...validFiles] : validFiles;
        onChange(allFiles);
      }

      // Handle upload if provided
      if (onUpload) {
        for (const fileItem of newFileItems) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, uploadStatus: "uploading" as const, uploadProgress: 0 } : f
            )
          );

          try {
            const url = await onUpload(fileItem.file);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id
                  ? { ...f, uploadStatus: url ? ("success" as const) : ("error" as const), error: url ? undefined : "Upload failed" }
                  : f
              )
            );
          } catch (error) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id
                  ? { ...f, uploadStatus: "error" as const, error: error instanceof Error ? error.message : "Upload failed" }
                  : f
              )
            );
          }
        }
      }
    },
    [files, multiple, maxFiles, onChange, onFileAdd, onUpload, maxSize]
  );

  const handleFileRemove = useCallback(
    (fileId: string) => {
      const fileToRemove = files.find((f) => f.id === fileId);
      if (fileToRemove) {
        setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
        onFileRemove?.(fileToRemove.file);
        if (onChange) {
          const remainingFiles = files.filter((f) => f.id !== fileId).map((f) => f.file);
          onChange(remainingFiles);
        }
      }
    },
    [files, onChange, onFileRemove]
  );

  const handleClick = () => {
    if (!disabled) {
    fileInputRef.current?.click();
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple,
    noClick: true,
    disabled,
    accept: typeof accept === "string" ? accept : accept,
    maxSize,
    onDrop: handleFileAdd,
    onDropRejected: (rejections) => {
      console.error("File rejection errors:", rejections);
    },
  });

  const displayFiles = files.length > 0 && showFileList;

  return (
    <div className={cn("w-full max-w-full", className)} {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover={disabled ? {} : "animate"}
        className={cn(
          "p-3 sm:p-4 md:p-6 lg:p-8 group/file block rounded-xl cursor-pointer w-full relative overflow-hidden",
          "border-2 border-dashed transition-all duration-300",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border/40 bg-card/50 hover:border-primary/50 hover:bg-card/80",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          multiple={multiple}
          accept={typeof accept === "string" ? accept : undefined}
          onChange={(e) => handleFileAdd(Array.from(e.target.files || []))}
          className="hidden"
          disabled={disabled}
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-30">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center relative z-20">
              <motion.div
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
              "relative z-40 bg-background/80 dark:bg-neutral-900/80 flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-xl",
              "shadow-lg border border-border/50 backdrop-blur-sm",
              isDragActive && "scale-110 shadow-2xl border-primary"
                )}
              >
                {isDragActive ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-primary flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8" />
                <p className="text-xs font-semibold">Drop it</p>
              </motion.div>
            ) : (
                <Upload className="h-8 w-8 text-primary" />
            )}
          </motion.div>

          <div className="mt-3 sm:mt-4 md:mt-6 text-center space-y-1 sm:space-y-2">
            <p className="relative z-20 font-semibold text-sm sm:text-base text-foreground px-1">
              {placeholder}
            </p>
            <p className="relative z-20 font-normal text-xs sm:text-sm text-muted-foreground px-2 sm:px-4">
              {description}
            </p>
            {maxSize && (
              <p className="relative z-20 font-normal text-xs text-muted-foreground/70">
                Max size: {formatFileSize(maxSize)}
              </p>
            )}
          </div>

          <div className="relative w-full mt-3 sm:mt-4 md:mt-6 max-w-full mx-auto">
            <AnimatePresence mode="popLayout">
              {displayFiles &&
                files.map((fileItem, idx) => (
                  <motion.div
                    key={fileItem.id}
                    layoutId={fileItem.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className={cn(
                      "relative overflow-hidden z-40 bg-card/90 dark:bg-neutral-900/90",
                      "flex flex-col items-start justify-start p-3 sm:p-4 mt-3 sm:mt-4 w-full mx-auto rounded-xl",
                      "shadow-lg border border-border/50 backdrop-blur-sm",
                      "hover:shadow-xl transition-shadow"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row justify-between w-full items-start gap-2 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 w-full">
                        <div className="text-xl sm:text-2xl flex-shrink-0 mt-0.5">
                          {getFileIcon(fileItem.file.type)}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                            layout
                            className="text-xs sm:text-sm font-semibold text-foreground truncate"
                            title={fileItem.file.name}
                  >
                            {fileItem.file.name}
                  </motion.p>
                          {showFileDetails && (
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-muted/50 whitespace-nowrap">
                                {formatFileSize(fileItem.file.size)}
                              </span>
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-muted/50 truncate max-w-[100px] sm:max-w-none">
                                {fileItem.file.type || "Unknown type"}
                              </span>
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-muted/50 whitespace-nowrap hidden sm:inline">
                                {formatDate(new Date(fileItem.file.lastModified))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 self-start sm:self-center">
                        {showUploadProgress && fileItem.uploadStatus === "uploading" && (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-12 sm:w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${fileItem.uploadProgress || 0}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                              {fileItem.uploadProgress || 0}%
                            </span>
                          </div>
                        )}
                        {fileItem.uploadStatus === "success" && (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        )}
                        {fileItem.uploadStatus === "error" && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                            {fileItem.error && (
                              <span className="text-[10px] sm:text-xs text-destructive hidden sm:inline" title={fileItem.error}>
                                Error
                              </span>
                            )}
                          </div>
                        )}
                        {!disabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileRemove(fileItem.id);
                            }}
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
              </motion.div>
                ))}
            </AnimatePresence>

            {!displayFiles && (
              <motion.div
                layoutId="file-upload-placeholder"
                variants={secondaryVariant}
                className="absolute opacity-0 border-2 border-dashed border-primary/30 inset-0 z-30 bg-transparent flex items-center justify-center h-24 mt-4 w-full max-w-[8rem] mx-auto rounded-xl"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-transparent shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={cn(
                "w-10 h-10 flex shrink-0 rounded-[2px] transition-colors",
                index % 2 === 0
                  ? "bg-background/30 dark:bg-neutral-950/30"
                  : "bg-background/50 dark:bg-neutral-950/50 shadow-[0px_0px_1px_2px_rgba(0,0,0,0.05)_inset] dark:shadow-[0px_0px_1px_2px_rgba(255,255,255,0.05)_inset]"
              )}
            />
          );
        })
      )}
    </div>
  );
}
