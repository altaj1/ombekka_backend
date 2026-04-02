import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { GameService } from "./game.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class GameController extends BaseController {
  constructor(private service: GameService) {
    super();
  }

  /**
   * Create a new Game
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });

    const result = await this.service.create(body);

    return this.sendCreatedResponse(res, result, "Game created successfully");
  };

  /**
   * Get all Games
   */
  //   public getAll = async (req: Request, res: Response) => {
  //     const pagination = this.extractPaginationParams(req);
  //     this.logAction("getAll", req, { pagination });
  //     const {} = req.query;
  //     const filters = {}; // Add any filter extraction logic here if needed

  //     const result = await this.service.findMany(filters, pagination);

  //     return this.sendPaginatedResponse(
  //       res,
  //       {
  //         page: result.page,
  //         limit: result.limit,
  //         total: result.total,
  //         totalPages: result.totalPages,
  //         hasNext: result.hasNext,
  //         hasPrevious: result.hasPrevious,
  //       },
  //       "Games retrieved successfully",
  //       result.data,
  //     );
  //   };
  public getAll = async (req: Request, res: Response) => {
    const pagination = this.extractPaginationParams(req);

    this.logAction("getAll", req, { pagination });

    const {
      search,
      player,
      eco,
      tournament,
      result,
      from,
      to,
      minElo,
      maxElo,
      country,
      title,
      minPly,
      maxPly,
      sortBy,
      sortOrder = "desc",
    } = req.query;

    const filters: any = {
      AND: [],
    };
    // 🔍 GLOBAL SEARCH (🔥 NEW)
    if (search) {
      filters.AND.push({
        OR: [
          {
            white: {
              name: {
                contains: search as string,
                mode: "insensitive",
              },
            },
          },
          {
            black: {
              name: {
                contains: search as string,
                mode: "insensitive",
              },
            },
          },
          {
            tournament: {
              event: {
                contains: search as string,
                mode: "insensitive",
              },
            },
          },
          {
            eco: {
              name: {
                contains: search as string,
                mode: "insensitive",
              },
            },
          },
          {
            ecoCode: {
              contains: search as string,
              mode: "insensitive",
            },
          },
        ],
      });
    }
    // 🎯 Player filter (white OR black)
    if (player) {
      filters.AND.push({
        OR: [
          {
            white: {
              name: {
                contains: player as string,
                mode: "insensitive",
              },
            },
          },
          {
            black: {
              name: {
                contains: player as string,
                mode: "insensitive",
              },
            },
          },
        ],
      });
    }

    // 🎯 ECO Code
    if (eco) {
      filters.AND.push({
        ecoCode: eco,
      });
    }

    // 🎯 Tournament name
    if (tournament) {
      filters.AND.push({
        tournament: {
          event: {
            contains: tournament as string,
            mode: "insensitive",
          },
        },
      });
    }

    // 🎯 Result
    if (result) {
      filters.AND.push({
        result: result,
      });
    }

    // 🎯 Date range
    if (from || to) {
      filters.AND.push({
        datePlayed: {
          gte: from ? new Date(from as string) : undefined,
          lte: to ? new Date(to as string) : undefined,
        },
      });
    }

    // 🎯 Elo range (white OR black)
    if (minElo || maxElo) {
      filters.AND.push({
        OR: [
          {
            whiteElo: {
              gte: minElo ? Number(minElo) : undefined,
              lte: maxElo ? Number(maxElo) : undefined,
            },
          },
          {
            blackElo: {
              gte: minElo ? Number(minElo) : undefined,
              lte: maxElo ? Number(maxElo) : undefined,
            },
          },
        ],
      });
    }

    // 🎯 Country filter (white OR black)
    if (country) {
      filters.AND.push({
        OR: [
          {
            white: {
              country: {
                equals: country,
              },
            },
          },
          {
            black: {
              country: {
                equals: country,
              },
            },
          },
        ],
      });
    }

    // 🎯 Title filter (GM, IM, FM etc)
    if (title) {
      filters.AND.push({
        OR: [
          {
            white: {
              title: {
                equals: title,
              },
            },
          },
          {
            black: {
              title: {
                equals: title,
              },
            },
          },
        ],
      });
    }

    // 🎯 Ply count range
    if (minPly || maxPly) {
      filters.AND.push({
        plyCount: {
          gte: minPly ? Number(minPly) : undefined,
          lte: maxPly ? Number(maxPly) : undefined,
        },
      });
    }

    // 🎯 Remove empty AND
    if (filters.AND.length === 0) {
      delete filters.AND;
    }

    // 🎯 Sorting
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = sortOrder;
    } else {
      orderBy.datePlayed = "desc"; // default
    }

    const resultData = await this.service.findMany(
      filters,
      pagination,
      orderBy,
    );

    return this.sendPaginatedResponse(
      res,
      {
        page: resultData.page,
        limit: resultData.limit,
        total: resultData.total,
        totalPages: resultData.totalPages,
        hasNext: resultData.hasNext,
        hasPrevious: resultData.hasPrevious,
      },
      "Games retrieved successfully",
      resultData.data,
    );
  };
  /**
   * Get single Game
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(res, "Game not found", HTTPStatusCode.NOT_FOUND);
    }

    return this.sendResponse(
      res,
      "Game retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update Game
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(res, "Game not found", HTTPStatusCode.NOT_FOUND);
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "Game updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Game
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(res, "Game not found", HTTPStatusCode.NOT_FOUND);
    }

    await this.service.deleteById(id);

    return this.sendResponse(
      res,
      "Game deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
