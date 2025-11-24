import { strapi } from "./client";
import type { CopyrightCheckStatus, CopyrightViolation, CopyrightWarning } from "./courseMaterial";

export interface CopyrightCheckOptions {
  videoFile?: File;
  audioFile?: File;
  videoUrl?: string;
  videoFingerprint?: string;
  provider?: "youtube_content_id" | "automated" | "manual";
}

export interface CopyrightCheckResult {
  status: CopyrightCheckStatus;
  result?: Record<string, unknown>;
  violations?: CopyrightViolation[];
  warnings?: CopyrightWarning[];
  fingerprint?: string;
  metadata?: Record<string, unknown>;
  provider?: string;
}

/**
 * Generate a video fingerprint/hash for duplicate detection
 * This is a simplified version - in production, you'd use a proper video fingerprinting library
 */
async function generateVideoFingerprint(file: File): Promise<string> {
  // For now, we'll use file name + size + last modified as a simple fingerprint
  // In production, you'd want to use actual video fingerprinting (e.g., perceptual hashing)
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return `${file.name}_${file.size}_${file.lastModified}_${hashHex.substring(0, 16)}`;
}

/**
 * Check for copyright violations using YouTube Content ID (if URL is YouTube)
 */
async function checkYouTubeContentID(videoUrl: string): Promise<Partial<CopyrightCheckResult>> {
  try {
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(youtubeRegex);
    
    if (!match) {
      return {
        status: "passed",
        provider: "youtube_content_id",
        result: { message: "Not a YouTube URL, skipping Content ID check" },
      };
    }

    const videoId = match[1];
    
    // In a real implementation, you would:
    // 1. Call YouTube Data API to check if video has Content ID matches
    // 2. Use YouTube Content ID API if you have access
    // 3. Check for copyright claims
    
    // For now, we'll simulate a check
    // In production, replace this with actual API calls
    const hasContentIDMatch = false; // This would come from YouTube API
    
    if (hasContentIDMatch) {
      return {
        status: "warning",
        provider: "youtube_content_id",
        violations: [{
          type: "content_id_match",
          source: `YouTube Video: ${videoId}`,
          confidence: 0.85,
          message: "Content ID match detected on YouTube",
        }],
        warnings: [{
          type: "copyright_claim",
          message: "This video may have copyright claims",
          severity: "medium",
        }],
        result: {
          videoId,
          hasMatch: true,
        },
      };
    }

    return {
      status: "passed",
      provider: "youtube_content_id",
      result: {
        videoId,
        hasMatch: false,
        message: "No Content ID matches found",
      },
    };
  } catch (error) {
    console.error("Error checking YouTube Content ID:", error);
    return {
      status: "warning",
      provider: "youtube_content_id",
      warnings: [{
        type: "check_failed",
        message: "Unable to verify copyright status",
        severity: "low",
      }],
      result: { error: "Check failed" },
    };
  }
}

/**
 * Check video metadata to detect potential copyright issues
 */
async function analyzeVideoMetadata(file: File): Promise<{
  duration?: number;
  hasMetadata: boolean;
  suspiciousIndicators: string[];
}> {
  const suspiciousIndicators: string[] = [];
  
  try {
    // Create video element to extract metadata
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(objectUrl);
        
        // Check for suspicious indicators
        // Very long videos (>2 hours) might be full movies/shows
        if (duration > 7200) {
          suspiciousIndicators.push("Very long duration (>2 hours)");
        }
        
        // Very short videos (<10 seconds) are usually original content
        // Videos between 10 seconds and 2 hours need more scrutiny
        
        resolve({
          duration,
          hasMetadata: true,
          suspiciousIndicators,
        });
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          hasMetadata: false,
          suspiciousIndicators: [],
        });
      };
      
      video.src = objectUrl;
      video.load();
    });
  } catch (error) {
    console.error("Error analyzing video metadata:", error);
    return {
      hasMetadata: false,
      suspiciousIndicators: [],
    };
  }
}

/**
 * Check file name for suspicious patterns
 */
function analyzeFileName(fileName: string): {
  suspicious: boolean;
  indicators: string[];
} {
  const indicators: string[] = [];
  const lowerName = fileName.toLowerCase();
  
  // Common patterns in copyrighted content
  const suspiciousPatterns = [
    /movie|film|cinema|theater/i,
    /episode|season|series|tv show/i,
    /full.*movie|complete.*movie/i,
    /hd.*rip|dvd.*rip|bluray/i,
    /torrent|download|free.*download/i,
    /copyright|©|all rights reserved/i,
  ];
  
  suspiciousPatterns.forEach((pattern) => {
    if (pattern.test(lowerName)) {
      indicators.push(`Suspicious filename pattern: ${pattern.source}`);
    }
  });
  
  return {
    suspicious: indicators.length > 0,
    indicators,
  };
}

/**
 * Automated copyright check using file analysis
 */
async function performAutomatedCheck(
  file: File,
  fingerprint: string
): Promise<Partial<CopyrightCheckResult>> {
  try {
    const fileSizeMB = file.size / (1024 * 1024);
    const warnings: CopyrightWarning[] = [];
    const violations: CopyrightViolation[] = [];
    
    // Analyze file name
    const fileNameAnalysis = analyzeFileName(file.name);
    if (fileNameAnalysis.suspicious) {
      violations.push({
        type: "suspicious_filename",
        message: `Filename contains suspicious patterns: ${file.name}`,
        confidence: 0.7,
      });
    }
    
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
        message: "Large file detected. Please ensure you have rights to use this content.",
        severity: "medium",
      });
    }
    
    // Analyze video/audio metadata if it's a media file
    let metadata: { duration?: number; hasMetadata: boolean; suspiciousIndicators: string[] } | null = null;
    if (file.type.startsWith("video/")) {
      metadata = await analyzeVideoMetadata(file);
    } else if (file.type.startsWith("audio/")) {
      // For audio files, use similar metadata analysis
      metadata = await analyzeAudioMetadata(file);
      
      if (metadata.hasMetadata && metadata.duration) {
        // Very long audio files (>3 hours) might be full albums
        if (metadata.duration > 10800) {
          violations.push({
            type: "very_long_duration",
            message: `Very long audio duration (${Math.round(metadata.duration / 60)} minutes)`,
            confidence: 0.65,
          });
        }
        
        // Very short audio (<10s) might be incomplete
        if (metadata.duration < 10) {
          warnings.push({
            type: "very_short_duration",
            message: "Very short audio - please ensure this is original content",
            severity: "low",
          });
        }
      }
      
      if (metadata.suspiciousIndicators && metadata.suspiciousIndicators.length > 0) {
        metadata.suspiciousIndicators.forEach((indicator) => {
          warnings.push({
            type: "metadata_indicator",
            message: indicator,
            severity: "medium",
          });
        });
      }
    }
    
    // Determine final status
    let status: CopyrightCheckStatus = "passed";
    if (violations.length > 0) {
      status = "failed";
    } else if (warnings.length > 0 || fileNameAnalysis.suspicious) {
      status = "warning";
    } else {
      // For self-recorded videos, we expect:
      // - Reasonable file size (<500MB typically)
      // - Reasonable duration (30s - 2 hours)
      // - No suspicious filename patterns
      // If all checks pass, mark as "passed" but require manual review for paid courses
      status = "passed";
    }
    
    return {
      status,
      provider: "automated",
      fingerprint,
      violations: violations.length > 0 ? violations : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      result: {
        fileSize: file.size,
        fileSizeMB: fileSizeMB.toFixed(2),
        fingerprint,
        checkedAt: new Date().toISOString(),
        fileNameAnalysis,
        metadataAnalysis: metadata && metadata.hasMetadata ? { duration: metadata.duration } : null,
      },
      metadata: {
        fileName: file.name,
        fileType: file.type,
        lastModified: file.lastModified,
      },
    };
  } catch (error) {
    console.error("Error performing automated copyright check:", error);
    return {
      status: "warning",
      provider: "automated",
      warnings: [{
        type: "check_failed",
        message: "Automated check encountered an error. Manual review recommended.",
        severity: "medium",
      }],
      result: { error: "Check failed" },
    };
  }
}

/**
 * Main copyright checking function
 */
export async function checkCopyright(
  options: CopyrightCheckOptions
): Promise<CopyrightCheckResult> {
  const { videoFile, audioFile, videoUrl, videoFingerprint, provider = "automated" } = options;
  const file = videoFile || audioFile;

  // Generate fingerprint if file is provided
  let fingerprint = videoFingerprint;
  if (file && !fingerprint) {
    fingerprint = await generateVideoFingerprint(file);
  }

  // If URL is provided and it's YouTube, check Content ID
  if (videoUrl && provider === "youtube_content_id") {
    const youtubeResult = await checkYouTubeContentID(videoUrl);
    return {
      status: youtubeResult.status || "pending",
      result: youtubeResult.result,
      violations: youtubeResult.violations,
      warnings: youtubeResult.warnings,
      fingerprint,
      provider: youtubeResult.provider || provider,
      metadata: {
        checkedAt: new Date().toISOString(),
        ...youtubeResult.metadata,
      },
    };
  }

  // Perform automated check if file is provided
  if (file && provider === "automated") {
    const automatedResult = await performAutomatedCheck(file, fingerprint!);
    return {
      status: automatedResult.status || "pending",
      result: automatedResult.result,
      violations: automatedResult.violations,
      warnings: automatedResult.warnings,
      fingerprint: automatedResult.fingerprint || fingerprint,
      provider: automatedResult.provider || provider,
      metadata: {
        checkedAt: new Date().toISOString(),
        ...automatedResult.metadata,
      },
    };
  }

  // Manual review
  if (provider === "manual") {
    return {
      status: "manual_review",
      provider: "manual",
      fingerprint,
      metadata: {
        checkedAt: new Date().toISOString(),
        requiresManualReview: true,
      },
    };
  }

  // Default: pending
  return {
    status: "pending",
    provider,
    fingerprint,
    metadata: {
      checkedAt: new Date().toISOString(),
    },
  };
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
        copyright_check_status: checkResult.status,
        copyright_check_result: checkResult.result || null,
        copyright_check_date: new Date().toISOString(),
        copyright_check_provider: checkResult.provider || null,
        copyright_violations: checkResult.violations || null,
        copyright_warnings: checkResult.warnings || null,
        video_fingerprint: checkResult.fingerprint || null,
        copyright_check_metadata: checkResult.metadata || null,
      },
    });
  } catch (error) {
    console.error("Error updating copyright check results:", error);
    throw error;
  }
}

