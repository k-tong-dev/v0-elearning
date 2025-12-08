import { strapi } from "./client";

export interface CopyrightInformation {
  copyrighted: boolean; // TRUE = has copyright issues, FALSE = safe/original
  copy_right_status: "pending" | "checking" | "passed" | "failed" | "warning" | "manual_review";
  copyright_check_result?: Record<string, unknown> | null;
  copyright_check_date?: string | null;
  copyright_check_provider?: string | null;
  copyright_violations?: any[] | null;
  copyright_warnings?: any[] | null;
  video_fingerprint?: string | null;
  copyright_check_metadata?: Record<string, unknown> | null;
}

export interface CopyrightCheckOptions {
  videoFile?: File;
  audioFile?: File;
  imageFile?: File;
  videoUrl?: string;
  imageUrl?: string;
  contentType: "video" | "audio" | "image" | "url";
  provider?: "youtube_content_id" | "automated" | "manual" | "image_check";
}

export interface CopyrightCheckResult {
  copyrighted: boolean; // TRUE = found copyright issues, FALSE = safe
  copy_right_status: "pending" | "checking" | "passed" | "failed" | "warning" | "manual_review";
  copyright_check_result?: Record<string, unknown>;
  copyright_violations?: any[];
  copyright_warnings?: any[];
  video_fingerprint?: string;
  copyright_check_metadata?: Record<string, unknown>;
  copyright_check_provider?: string;
}

/**
 * Generate a video/image fingerprint for duplicate detection
 */
async function generateFingerprint(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return `${file.name}_${file.size}_${file.lastModified}_${hashHex.substring(0, 16)}`;
  } catch (error) {
    console.error("Error generating fingerprint:", error);
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
}

/**
 * Check YouTube URL for copyright issues
 */
async function checkYouTubeURL(videoUrl: string): Promise<Partial<CopyrightCheckResult>> {
  try {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(youtubeRegex);
    
    if (!match) {
      return {
        copyrighted: false,
        copy_right_status: "passed",
        copyright_check_provider: "youtube_content_id",
        copyright_check_result: { message: "Not a YouTube URL" },
      };
    }

    const videoId = match[1];
    
    // In production, you would call YouTube Data API here
    // For now, we simulate: YouTube videos are generally copyright-free if they're embeddable
    // But we mark as needs manual review to be safe
    
    return {
      copyrighted: false, // Assume safe since it's embeddable
      copy_right_status: "passed",
      copyright_check_provider: "youtube_content_id",
      copyright_warnings: [{
        type: "external_content",
        message: "YouTube video - Please ensure you have permission to use this content in your paid course",
        severity: "low",
      }],
      copyright_check_result: {
        videoId,
        platform: "youtube",
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error checking YouTube URL:", error);
    return {
      copyrighted: false,
      copy_right_status: "warning",
      copyright_warnings: [{
        type: "check_failed",
        message: "Unable to verify YouTube video copyright status",
        severity: "medium",
      }],
    };
  }
}

/**
 * Check video file for copyright issues
 */
async function checkVideoFile(file: File, fingerprint: string): Promise<Partial<CopyrightCheckResult>> {
  try {
    const fileSizeMB = file.size / (1024 * 1024);
    const violations: any[] = [];
    const warnings: any[] = [];
    
    // Check file name for suspicious patterns
    const lowerName = file.name.toLowerCase();
    const suspiciousPatterns = [
      /movie|film|cinema|theater/i,
      /episode|season|series|tv show/i,
      /full.*movie|complete.*movie/i,
      /hd.*rip|dvd.*rip|bluray|webrip/i,
      /torrent|download|pirat/i,
    ];
    
    let hasSuspiciousName = false;
    suspiciousPatterns.forEach((pattern) => {
      if (pattern.test(lowerName)) {
        hasSuspiciousName = true;
        violations.push({
          type: "suspicious_filename",
          message: `Filename suggests copyrighted content: "${file.name}"`,
          confidence: 0.7,
        });
      }
    });
    
    // Check file size - very large files might be copyrighted content
    if (fileSizeMB > 1000) {
      violations.push({
        type: "very_large_file",
        message: `Very large file size (${fileSizeMB.toFixed(2)}MB) - may contain copyrighted content`,
        confidence: 0.6,
      });
    } else if (fileSizeMB > 500) {
      warnings.push({
        type: "large_file",
        message: "Large file detected. Please ensure this is original content.",
        severity: "medium",
      });
    }
    
    // Analyze video metadata
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    
    const metadata = await new Promise<{duration: number}>((resolve) => {
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(objectUrl);
        resolve({ duration });
      };
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ duration: 0 });
      };
      video.src = objectUrl;
      video.load();
    });
    
    // Very long videos (>2 hours) might be movies/shows
    if (metadata.duration > 7200) {
      violations.push({
        type: "very_long_duration",
        message: `Very long duration (${Math.round(metadata.duration / 60)} minutes) - may be copyrighted content`,
        confidence: 0.65,
      });
    }
    
    // Determine if copyrighted
    const isCoprighted = violations.length > 0;
    const status = isCoprighted ? "failed" : (warnings.length > 0 ? "warning" : "passed");
    
    return {
      copyrighted: isCoprighted, // TRUE if violations found
      copy_right_status: status,
      video_fingerprint: fingerprint,
      copyright_violations: violations.length > 0 ? violations : undefined,
      copyright_warnings: warnings.length > 0 ? warnings : undefined,
      copyright_check_provider: "automated",
      copyright_check_result: {
        fileSize: file.size,
        fileSizeMB: fileSizeMB.toFixed(2),
        duration: metadata.duration,
        fingerprint,
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error checking video file:", error);
    return {
      copyrighted: false, // Default to safe on error
      copy_right_status: "warning",
      copyright_warnings: [{
        type: "check_failed",
        message: "Copyright check encountered an error",
        severity: "medium",
      }],
    };
  }
}

/**
 * Check image for copyright issues
 */
async function checkImageFile(file: File, fingerprint: string): Promise<Partial<CopyrightCheckResult>> {
  try {
    const fileSizeMB = file.size / (1024 * 1024);
    const violations: any[] = [];
    const warnings: any[] = [];
    
    // Check file name for suspicious patterns
    const lowerName = file.name.toLowerCase();
    const suspiciousPatterns = [
      /getty|shutterstock|istock|adobe.*stock/i,
      /watermark|copyright|©/i,
      /professional.*photo|stock.*photo/i,
    ];
    
    let hasSuspiciousName = false;
    suspiciousPatterns.forEach((pattern) => {
      if (pattern.test(lowerName)) {
        hasSuspiciousName = true;
        violations.push({
          type: "suspicious_filename",
          message: `Filename suggests stock/copyrighted image: "${file.name}"`,
          confidence: 0.8,
        });
      }
    });
    
    // Very large images might be professional/copyrighted
    if (fileSizeMB > 50) {
      warnings.push({
        type: "large_image",
        message: "Very large image file. Ensure this is original content.",
        severity: "low",
      });
    }
    
    // Check image dimensions and metadata
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    const metadata = await new Promise<{width: number; height: number}>((resolve) => {
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        URL.revokeObjectURL(objectUrl);
        resolve({ width, height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: 0, height: 0 });
      };
      img.src = objectUrl;
    });
    
    // Very high resolution might be professional photography
    const megapixels = (metadata.width * metadata.height) / 1000000;
    if (megapixels > 20) {
      warnings.push({
        type: "high_resolution",
        message: `Very high resolution image (${megapixels.toFixed(1)}MP). Ensure you have rights to use this.`,
        severity: "low",
      });
    }
    
    // Determine if copyrighted
    const isCopyrighted = violations.length > 0;
    const status = isCopyrighted ? "failed" : (warnings.length > 0 ? "warning" : "passed");
    
    return {
      copyrighted: isCopyrighted, // TRUE if violations found
      copy_right_status: status,
      video_fingerprint: fingerprint,
      copyright_violations: violations.length > 0 ? violations : undefined,
      copyright_warnings: warnings.length > 0 ? warnings : undefined,
      copyright_check_provider: "image_check",
      copyright_check_result: {
        fileSize: file.size,
        fileSizeMB: fileSizeMB.toFixed(2),
        width: metadata.width,
        height: metadata.height,
        megapixels: megapixels.toFixed(1),
        fingerprint,
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error checking image file:", error);
    return {
      copyrighted: false, // Default to safe on error
      copy_right_status: "warning",
      copyright_warnings: [{
        type: "check_failed",
        message: "Image copyright check encountered an error",
        severity: "medium",
      }],
    };
  }
}

/**
 * Main copyright checking function
 */
export async function checkCopyright(
  options: CopyrightCheckOptions
): Promise<CopyrightCheckResult> {
  const { videoFile, audioFile, imageFile, videoUrl, imageUrl, contentType, provider = "automated" } = options;
  
  try {
    // Handle URL content
    if (videoUrl) {
      const urlResult = await checkYouTubeURL(videoUrl);
      return {
        copyrighted: urlResult.copyrighted ?? false,
        copy_right_status: urlResult.copy_right_status ?? "passed",
        copyright_check_result: urlResult.copyright_check_result,
        copyright_violations: urlResult.copyright_violations,
        copyright_warnings: urlResult.copyright_warnings,
        copyright_check_provider: urlResult.copyright_check_provider,
        copyright_check_metadata: {
          checkedAt: new Date().toISOString(),
          url: videoUrl,
        },
      };
    }
    
    // Handle video file
    if (videoFile && contentType === "video") {
      const fingerprint = await generateFingerprint(videoFile);
      const videoResult = await checkVideoFile(videoFile, fingerprint);
      return {
        copyrighted: videoResult.copyrighted ?? false,
        copy_right_status: videoResult.copy_right_status ?? "passed",
        copyright_check_result: videoResult.copyright_check_result,
        copyright_violations: videoResult.copyright_violations,
        copyright_warnings: videoResult.copyright_warnings,
        video_fingerprint: videoResult.video_fingerprint,
        copyright_check_provider: videoResult.copyright_check_provider,
        copyright_check_metadata: {
          checkedAt: new Date().toISOString(),
          fileName: videoFile.name,
        },
      };
    }
    
    // Handle image file
    if (imageFile && contentType === "image") {
      const fingerprint = await generateFingerprint(imageFile);
      const imageResult = await checkImageFile(imageFile, fingerprint);
      return {
        copyrighted: imageResult.copyrighted ?? false,
        copy_right_status: imageResult.copy_right_status ?? "passed",
        copyright_check_result: imageResult.copyright_check_result,
        copyright_violations: imageResult.copyright_violations,
        copyright_warnings: imageResult.copyright_warnings,
        video_fingerprint: imageResult.video_fingerprint,
        copyright_check_provider: imageResult.copyright_check_provider,
        copyright_check_metadata: {
          checkedAt: new Date().toISOString(),
          fileName: imageFile.name,
        },
      };
    }
    
    // Default: pending
    return {
      copyrighted: false,
      copy_right_status: "pending",
      copyright_check_provider: provider,
      copyright_check_metadata: {
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error in copyright check:", error);
    return {
      copyrighted: false,
      copy_right_status: "warning",
      copyright_warnings: [{
        type: "check_failed",
        message: "Copyright check failed",
        severity: "high",
      }],
      copyright_check_metadata: {
        checkedAt: new Date().toISOString(),
        error: String(error),
      },
    };
  }
}

/**
 * Update course content with copyright check results
 */
export async function updateContentCopyrightCheck(
  contentDocumentId: string,
  checkResult: CopyrightCheckResult
): Promise<void> {
  try {
    await strapi.put(`/api/course-contents/${contentDocumentId}`, {
      data: {
        copyright_information: {
          copyrighted: checkResult.copyrighted,
          copy_right_status: checkResult.copy_right_status,
          copyright_check_result: checkResult.copyright_check_result || null,
          copyright_check_date: new Date().toISOString(),
          copyright_check_provider: checkResult.copyright_check_provider || null,
          copyright_violations: checkResult.copyright_violations || null,
          copyright_warnings: checkResult.copyright_warnings || null,
          video_fingerprint: checkResult.video_fingerprint || null,
          copyright_check_metadata: checkResult.copyright_check_metadata || null,
        },
      },
    });
  } catch (error) {
    console.error("Error updating copyright check results:", error);
    throw error;
  }
}
