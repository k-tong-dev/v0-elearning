import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

/**
 * POST /api/upload/cloudinary
 * Upload file to Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string | null;
    const resourceType = (formData.get("resource_type") as string) || "auto";
    const publicId = formData.get("public_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert File to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    return new Promise((resolve) => {
      const uploadOptions: any = {
        resource_type: resourceType === "auto" ? "auto" : resourceType,
      };

      if (folder) {
        uploadOptions.folder = folder;
      }

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            resolve(
              NextResponse.json(
                { error: error.message || "Failed to upload to Cloudinary" },
                { status: 500 }
              )
            );
            return;
          }

          if (!result) {
            resolve(
              NextResponse.json(
                { error: "No result from Cloudinary" },
                { status: 500 }
              )
            );
            return;
          }

          resolve(
            NextResponse.json({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
              resource_type: result.resource_type,
            })
          );
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error("Error in Cloudinary upload route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/cloudinary
 * Delete file from Cloudinary
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_id } = body;

    if (!public_id) {
      return NextResponse.json(
        { error: "No public_id provided" },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === "ok") {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to delete from Cloudinary" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in Cloudinary delete route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

