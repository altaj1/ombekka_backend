import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import path from "path";

import fs from "fs";
import { promises as fsPromises } from "fs";
import multer from "multer";
import config from "@/core/config";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const sendImageToCloudinary = (
  imageName: string,
  filePath: string,
  folderName?: string | null,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    if (!filePath) return reject(new Error("File path missing"));

    cloudinary.uploader.upload(
      filePath,
      {
        public_id: imageName,
        folder: folderName || config.cloudinary.imageFolderName,
        resource_type: "auto",
      },
      async (error, result) => {
        if (error) {
          console.error(
            "Cloudinary Upload Error Details:",
            JSON.stringify(error, null, 2),
          );
          return reject(error);
        }

        try {
          // Remove file from local storage after successful upload
          await fsPromises.unlink(filePath);
        } catch (e) {
          console.error("Failed to delete local file:", e);
        }

        resolve(result as UploadApiResponse);
      },
    );
  });
};

export const sendImagesToCloudinary = async (
  images: Express.Multer.File[], // Expecting multiple files
  folderName: string | undefined | null,
): Promise<string[]> => {
  try {
    const uploadPromises = images.map((image) => {
      return new Promise<string>((resolve, reject) => {
        const resourceType = image.mimetype.startsWith("image/")
          ? "image"
          : image.mimetype === "application/pdf"
            ? "auto"
            : "video";

        cloudinary.uploader.upload(
          image.path,
          {
            public_id: image.filename, // Unique filename for Cloudinary
            folder: folderName || config.cloudinary.imageFolderName,
            resource_type: resourceType,
          },
          (error, result) => {
            // Remove file from local storage after upload
            fs.unlink(image.path, (err) => {
              if (err) {
                console.error("Failed to delete local file:", err);
              }
            });

            if (error) {
              return reject(error);
            }

            resolve(result?.secure_url || "");
          },
        );
      });
    });

    // Wait for all images to upload
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload images.");
  }
};

export const deleteImageFromCloudinary = (
  publicId: string,
): Promise<{ result: string }> => {
  return new Promise((resolve, reject) => {
    if (!publicId) {
      return reject(new Error("Public ID is required"));
    }

    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, videos and PDFs are allowed.",
        ),
      );
    }
  },
});

export default cloudinary;
