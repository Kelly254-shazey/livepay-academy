import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { API_PREFIX } from "./common/constants/domain";
import { errorHandler } from "./common/errors/error-handler";
import { httpLogger } from "./config/logger";
import { env } from "./config/env";
import { createSwaggerDocument } from "./config/swagger";
import { requestContext } from "./common/middleware/request-context";
import { prisma } from "./infrastructure/db/prisma";
import { redis } from "./infrastructure/cache/redis";
import { AuditService } from "./common/audit/audit.service";
import { JavaFinanceClient } from "./infrastructure/integrations/java-finance.client";
import { PythonIntelligenceClient } from "./infrastructure/integrations/python-intelligence.client";
import { StreamingProviderClient } from "./infrastructure/integrations/streaming-provider.client";
import { createHealthRouter } from "./modules/health/health.routes";
import { AuthRepository } from "./modules/auth/auth.repository";
import { AuthService } from "./modules/auth/auth.service";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { UsersRepository } from "./modules/users/users.repository";
import { UsersService } from "./modules/users/users.service";
import { createUsersRouter } from "./modules/users/users.routes";
import { CreatorsRepository } from "./modules/creators/creators.repository";
import { CreatorsService } from "./modules/creators/creators.service";
import { createCreatorsRouter } from "./modules/creators/creators.routes";
import { CategoriesRepository } from "./modules/categories/categories.repository";
import { CategoriesService } from "./modules/categories/categories.service";
import { createCategoriesRouter } from "./modules/categories/categories.routes";
import { AccessService } from "./modules/access/access.service";
import { createAccessRouter } from "./modules/access/access.routes";
import { LiveSessionsRepository } from "./modules/live-sessions/live-sessions.repository";
import { LiveSessionsService } from "./modules/live-sessions/live-sessions.service";
import { createLiveSessionsRouter } from "./modules/live-sessions/live-sessions.routes";
import { PremiumContentRepository } from "./modules/premium-content/premium-content.repository";
import { PremiumContentService } from "./modules/premium-content/premium-content.service";
import { createPremiumContentRouter } from "./modules/premium-content/premium-content.routes";
import { ClassesRepository } from "./modules/classes/classes.repository";
import { ClassesService } from "./modules/classes/classes.service";
import { createClassesRouter } from "./modules/classes/classes.routes";
import { NotificationsRepository } from "./modules/notifications/notifications.repository";
import { NotificationsService } from "./modules/notifications/notifications.service";
import { createNotificationsRouter } from "./modules/notifications/notifications.routes";
import { AdminRepository } from "./modules/admin/admin.repository";
import { AdminService } from "./modules/admin/admin.service";
import { createAdminRouter } from "./modules/admin/admin.routes";
import { WalletsService } from "./modules/wallets/wallets.service";
import { createWalletsRouter } from "./modules/wallets/wallets.routes";
import { ReviewsRepository } from "./modules/reviews/reviews.repository";
import { ReviewsService } from "./modules/reviews/reviews.service";
import { createReviewsRouter } from "./modules/reviews/reviews.routes";
import { ReportsRepository } from "./modules/reports/reports.repository";
import { ReportsService } from "./modules/reports/reports.service";
import { createReportsRouter } from "./modules/reports/reports.routes";
import { FrontendService } from "./modules/frontend/frontend.service";
import { createFrontendRouter } from "./modules/frontend/frontend.routes";

export function createApp() {
  const app = express();

  const auditService = new AuditService(prisma);
  const javaFinanceClient = new JavaFinanceClient();
  const pythonClient = new PythonIntelligenceClient();
  const streamingProviderClient = new StreamingProviderClient();
  const authService = new AuthService(new AuthRepository(prisma), auditService);
  const accessService = new AccessService(prisma, auditService, javaFinanceClient, pythonClient);
  const usersService = new UsersService(new UsersRepository(prisma), auditService, pythonClient);
  const creatorsService = new CreatorsService(new CreatorsRepository(prisma), auditService, pythonClient);
  const categoriesService = new CategoriesService(new CategoriesRepository(prisma), redis);
  const liveSessionsService = new LiveSessionsService(
    new LiveSessionsRepository(prisma),
    accessService,
    auditService,
    pythonClient,
    streamingProviderClient
  );
  const premiumContentService = new PremiumContentService(
    new PremiumContentRepository(prisma),
    accessService,
    auditService,
    pythonClient
  );
  const classesService = new ClassesService(new ClassesRepository(prisma), accessService, auditService, pythonClient);
  const notificationsService = new NotificationsService(new NotificationsRepository(prisma), auditService);
  const walletsService = new WalletsService(javaFinanceClient, auditService);
  const reviewsService = new ReviewsService(new ReviewsRepository(prisma), auditService);
  const reportsService = new ReportsService(new ReportsRepository(prisma), auditService, pythonClient);
  const adminService = new AdminService(new AdminRepository(prisma), auditService, pythonClient, javaFinanceClient);
  const frontendService = new FrontendService(
    prisma,
    authService,
    accessService,
    javaFinanceClient,
    walletsService
  );
  const corsOrigin = env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN;
  const corsCredentials = env.CORS_ORIGIN !== "*";

  app.use(requestContext);
  app.use(httpLogger);
  app.use(
    cors({
      origin: corsOrigin,
      credentials: corsCredentials
    })
  );
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(express.json({ limit: "1mb" }));

  if (env.SWAGGER_ENABLED) {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(createSwaggerDocument()));
  }

  app.get("/", (_req, res) => {
    res.json({
      service: "livegate-nodejs-service",
      version: "1.0.0"
    });
  });

  app.use("/api", createFrontendRouter(frontendService));
  app.use("/health", createHealthRouter(prisma, redis, {
    javaFinance: javaFinanceClient,
    pythonIntelligence: pythonClient
  }));

  const api = express.Router();
  api.use("/auth", createAuthRouter(authService));
  api.use("/users", createUsersRouter(usersService));
  api.use("/creators", createCreatorsRouter(creatorsService));
  api.use("/categories", createCategoriesRouter(categoriesService));
  api.use("/access", createAccessRouter(accessService));
  api.use("/lives", createLiveSessionsRouter(liveSessionsService));
  api.use("/content", createPremiumContentRouter(premiumContentService));
  api.use("/classes", createClassesRouter(classesService));
  api.use("/notifications", createNotificationsRouter(notificationsService));
  api.use("/wallets", createWalletsRouter(walletsService));
  api.use("/reviews", createReviewsRouter(reviewsService));
  api.use("/reports", createReportsRouter(reportsService));
  api.use("/admin", createAdminRouter(adminService));

  app.use(API_PREFIX, api);
  app.use(errorHandler);

  return app;
}
