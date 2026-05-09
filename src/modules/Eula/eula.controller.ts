// src/modules/Eula/eula.controller.ts
import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { EulaService } from "./eula.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";
import { BadRequestError } from "@/core/errors/AppError";

export class EulaController extends BaseController {
  constructor(private eulaService: EulaService) {
    super();
  }

  /**
   * Upload or replace the EULA PDF
   * POST /api/eula
   */
  public uploadEula = async (req: Request, res: Response) => {
    this.logAction("uploadEula", req);

    // const file = req.file;
    // if (!file) {
    //   throw new BadRequestError("Please upload a PDF file");
    // }

    // const result = await this.eulaService.uploadEula(file);
    const result = await this.eulaService.uploadEula(req.body);

    return this.sendResponse(
      res,
      "EULA PDF uploaded and updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Get current active EULA PDF
   * GET /api/eula
   */
  public getEula = async (req: Request, res: Response) => {
    this.logAction("getEula", req);

    const result = await this.eulaService.findMany();

    return this.sendResponse(
      res,
      "EULA retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };
}
