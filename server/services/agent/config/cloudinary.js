import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

const cleanEnv = (val) => (val ? String(val).trim().replace(/^["']|["']$/g, "") : "");

cloudinary.config({
  cloud_name: cleanEnv(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: cleanEnv(process.env.CLOUDINARY_API_KEY),
  api_secret: cleanEnv(process.env.CLOUDINARY_API_SECRET),
  secure: true,
});

export const isCloudinaryConfigured = () => {
  return Boolean(
    cleanEnv(process.env.CLOUDINARY_CLOUD_NAME) &&
    cleanEnv(process.env.CLOUDINARY_API_KEY) &&
    cleanEnv(process.env.CLOUDINARY_API_SECRET)
  );
};

export const getCloudinaryDownloadUrl = (publicId, resourceType = "raw") => {
  if (!isCloudinaryConfigured() || !publicId) return "";
  try {
    return cloudinary.utils.private_download_url(publicId, null, {
      resource_type: resourceType,
      type: "upload",
    });
  } catch (err) {
    console.warn("[Cloudinary] Failed to create signed download URL:", err.message);
    return "";
  }
};

export const uploadImageToCloudinary = async (imageSource, options = {}) => {
  if (!isCloudinaryConfigured()) {
    console.warn(
      "[Cloudinary] Credentials not fully set (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Skipping Cloudinary upload."
    );
    return {
      url: typeof imageSource === "string" ? imageSource : "",
      publicId: "",
      storedInCloudinary: false,
    };
  }

  try {
    const uploadOptions = {
      folder: "ai_generated_images",
      resource_type: "image",
      ...options,
    };

    let result;
    if (Buffer.isBuffer(imageSource)) {
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, res) => {
            if (error) return reject(error);
            resolve(res);
          }
        );
        stream.end(imageSource);
      });
    } else {
      result = await cloudinary.uploader.upload(imageSource, uploadOptions);
    }

    let downloadUrl = result.secure_url || result.url;
    if (uploadOptions.resource_type === "raw" && result.public_id) {
      const signed = getCloudinaryDownloadUrl(result.public_id, "raw");
      if (signed) {
        downloadUrl = signed;
      }
    }

    return {
      url: downloadUrl,
      rawUrl: result.secure_url || result.url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      storedInCloudinary: true,
    };
  } catch (error) {
    console.error("[Cloudinary] Upload error:", error.message);
    return {
      url: typeof imageSource === "string" ? imageSource : "",
      publicId: "",
      storedInCloudinary: false,
      error: error.message,
    };
  }
};

export default cloudinary;
