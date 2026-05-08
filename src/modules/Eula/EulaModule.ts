// src/modules/Eula/EulaModule.ts
import { BaseModule } from "@/core/BaseModule";
import { EulaService } from "./eula.service";
import { EulaController } from "./eula.controller";
import { EulaRoutes } from "./eula.routes";
import { AppLogger } from "@/core/logging/logger";

export class EulaModule extends BaseModule {
  public readonly name = "EulaModule";
  public readonly version = "1.0.0";
  public readonly dependencies = [];

  private eulaService!: EulaService;
  private eulaController!: EulaController;
  private eulaRoutes!: EulaRoutes;

  /**
   * Setup module services
   */
  protected async setupServices(): Promise<void> {
    // Initialize service
    this.eulaService = new EulaService(this.context.prisma);
  }

  /**
   * Setup module routes
   */
  protected async setupRoutes(): Promise<void> {
    // Initialize controller
    this.eulaController = new EulaController(this.eulaService);

    // Initialize routes
    this.eulaRoutes = new EulaRoutes(this.eulaController);

    // Mount routes under /api/eula
    this.router.use("/api/eula", this.eulaRoutes.getRouter());
  }

  /**
   * Custom initialization logic after routes setup
   */
  protected async onAfterInit(): Promise<void> {
    AppLogger.info("EULA module initialized successfully");
  }

  /**
   * Module-specific health check
   */
  public async healthCheck(): Promise<{ status: "healthy" | "unhealthy"; details?: any }> {
    try {
      const eulaCount = await this.context.prisma.eula.count();
      return {
        status: "healthy",
        details: {
          hasActiveEula: eulaCount > 0,
          totalEulaRecords: eulaCount,
          lastChecked: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        details: {
          error: error instanceof Error ? error.message : String(error),
          lastChecked: new Date().toISOString(),
        },
      };
    }
  }
}
