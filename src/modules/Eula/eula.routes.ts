// src/modules/Eula/eula.routes.ts
import { Router, Request, Response } from "express";
import { EulaController } from "./eula.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authenticate, authorize } from "@/middleware/auth";
import { upload } from "@/utils/sendImageToCloudinery";

export class EulaRoutes {
  private router: Router;
  private eulaController: EulaController;

  constructor(eulaController: EulaController) {
    this.router = Router();
    this.eulaController = eulaController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @route   GET /api/eula
     * @desc    Get the current active EULA PDF
     * @access  Public
     */
    this.router.get(
      "/",
      asyncHandler((req: Request, res: Response) =>
        this.eulaController.getEula(req, res),
      ),
    );

    /**
     * @route   POST /api/eula
     * @desc    Upload or replace the EULA PDF
     * @access  Private (Admin only)
     */
    this.router.post(
      "/",
      // authenticate,
      // authorize("admin"),
      upload.single("eula"),
      asyncHandler((req: Request, res: Response) =>
        this.eulaController.uploadEula(req, res),
      ),
    );

    /**
     * @route   PUT /api/eula
     * @desc    Replace the EULA PDF (Alias for POST)
     * @access  Private (Admin only)
     */
    this.router.put(
      "/",
      authenticate,
      authorize("admin"),
      upload.single("eula"),
      asyncHandler((req: Request, res: Response) =>
        this.eulaController.uploadEula(req, res),
      ),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
