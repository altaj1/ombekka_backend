import { BaseModule } from '@/core/BaseModule';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameRoutes } from './game.routes';

export class GameModule extends BaseModule {
    public readonly name = 'GameModule';
    public readonly version = '1.0.0';
    // Add dependencies if this module relies on others
    public readonly dependencies = []; 

    private service!: GameService;
    private controller!: GameController;
    private routes!: GameRoutes;

    protected async setupServices(): Promise<void> {
        this.service = new GameService(this.context.prisma);
    }

    protected async setupRoutes(): Promise<void> {
        this.controller = new GameController(this.service);
        this.routes = new GameRoutes(this.controller);

        this.router.use('/api/games', this.routes.getRouter());
    }
}
