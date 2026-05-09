// src/modules/Eula/eula.service.ts
import { BaseService } from "@/core/BaseService";
import { PrismaClient, Eula } from "@/generated/prisma/client";
import {
  sendImageToCloudinary,
  deleteImageFromCloudinary,
} from "@/utils/sendImageToCloudinery";
import { AppLogger } from "@/core/logging/logger";
import { BadRequestError } from "@/core/errors/AppError";
import { PaginationOptions } from "@/types/types";

export class EulaService extends BaseService<Eula> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Eula");
  }

  protected getModel() {
    return this.prisma.eula;
  }

  /**
   * Get the current active EULA PDF
   */
  async getLatestEula(): Promise<Eula | null> {
    return await this.prisma.eula.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Upload and replace the EULA PDF
   */
  // async uploadEula(file: Express.Multer.File): Promise<Eula> {
  //   if (!file) {
  //     throw new BadRequestError("EULA PDF file is required");
  //   }

  //   // 1. Check if an old EULA exists
  //   const existing = await this.getLatestEula();

  //   // 2. If it exists, delete it from Cloudinary
  //   if (existing) {
  //     try {
  //       await deleteImageFromCloudinary(existing.publicId);
  //       AppLogger.info("Previous EULA deleted from Cloudinary", {
  //         publicId: existing.publicId,
  //       });
  //     } catch (error) {
  //       AppLogger.error("Failed to delete previous EULA from Cloudinary", {
  //         publicId: existing.publicId,
  //         error: error instanceof Error ? error.message : String(error),
  //       });
  //       // We continue anyway to upload the new one
  //     }
  //   }

  //   // 3. Upload new PDF to Cloudinary
  //   const folderName = "eula_documents";
  //   const fileName = `eula_${Date.now()}`;

  //   const uploaded = await sendImageToCloudinary(
  //     fileName,
  //     file.path,
  //     folderName,
  //   );

  //   const eulaData = {
  //     fileUrl: uploaded.secure_url,
  //     publicId: uploaded.public_id,
  //     fileName: file.originalname,
  //   };

  //   // 4. Save metadata in the database
  //   let result: Eula;
  //   if (existing) {
  //     // Replace existing record
  //     result = await this.updateById(existing.id, eulaData);
  //     AppLogger.info("EULA record updated in database", { id: result.id });
  //   } else {
  //     // Create new record
  //     result = await this.create(eulaData);
  //     AppLogger.info("New EULA record created in database", { id: result.id });
  //   }

  //   return result;
  // }
  async uploadEula(eulaFileString: string) {
    // 1. Check if an old EULA exists
    const existing = await this.getLatestEula();

    // 4. Save metadata in the database
    let result: Eula;
    if (existing) {
      // Replace existing record
      result = await this.updateById(existing.id, eulaFileString);
      AppLogger.info("EULA record updated in database", { id: result.id });
    } else {
      // Create new record
      result = await this.create(eulaFileString);
      AppLogger.info("New EULA record created in database", { id: result.id });
    }

    return result;
  }

  public async findMany(
    filters: any = {},
    pagination?: Partial<PaginationOptions>,
    orderBy?: any,
    include?: any,
  ) {
    return super.findMany(filters, pagination, include);
  }
}
