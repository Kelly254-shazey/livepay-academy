"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const domain_1 = require("./common/constants/domain");
const error_handler_1 = require("./common/errors/error-handler");
const logger_1 = require("./config/logger");
const cors_2 = require("./config/cors");
const env_1 = require("./config/env");
const swagger_1 = require("./config/swagger");
const request_context_1 = require("./common/middleware/request-context");
const prisma_1 = require("./infrastructure/db/prisma");
const redis_1 = require("./infrastructure/cache/redis");
const email_service_1 = require("./infrastructure/communications/email.service");
const clerk_service_1 = require("./infrastructure/auth/clerk.service");
const google_auth_service_1 = require("./infrastructure/auth/google-auth.service");
const audit_service_1 = require("./common/audit/audit.service");
const java_finance_client_1 = require("./infrastructure/integrations/java-finance.client");
const python_intelligence_client_1 = require("./infrastructure/integrations/python-intelligence.client");
const streaming_provider_client_1 = require("./infrastructure/integrations/streaming-provider.client");
const health_routes_1 = require("./modules/health/health.routes");
const auth_repository_1 = require("./modules/auth/auth.repository");
const auth_service_1 = require("./modules/auth/auth.service");
const auth_security_service_1 = require("./modules/auth/auth-security.service");
const auth_routes_1 = require("./modules/auth/auth.routes");
const users_repository_1 = require("./modules/users/users.repository");
const users_service_1 = require("./modules/users/users.service");
const users_routes_1 = require("./modules/users/users.routes");
const creators_repository_1 = require("./modules/creators/creators.repository");
const creators_service_1 = require("./modules/creators/creators.service");
const creators_routes_1 = require("./modules/creators/creators.routes");
const categories_repository_1 = require("./modules/categories/categories.repository");
const categories_service_1 = require("./modules/categories/categories.service");
const categories_routes_1 = require("./modules/categories/categories.routes");
const access_service_1 = require("./modules/access/access.service");
const access_routes_1 = require("./modules/access/access.routes");
const live_sessions_repository_1 = require("./modules/live-sessions/live-sessions.repository");
const live_sessions_service_1 = require("./modules/live-sessions/live-sessions.service");
const live_sessions_routes_1 = require("./modules/live-sessions/live-sessions.routes");
const premium_content_repository_1 = require("./modules/premium-content/premium-content.repository");
const premium_content_service_1 = require("./modules/premium-content/premium-content.service");
const premium_content_routes_1 = require("./modules/premium-content/premium-content.routes");
const classes_repository_1 = require("./modules/classes/classes.repository");
const classes_service_1 = require("./modules/classes/classes.service");
const classes_routes_1 = require("./modules/classes/classes.routes");
const notifications_repository_1 = require("./modules/notifications/notifications.repository");
const notifications_service_1 = require("./modules/notifications/notifications.service");
const notifications_routes_1 = require("./modules/notifications/notifications.routes");
const admin_repository_1 = require("./modules/admin/admin.repository");
const admin_service_1 = require("./modules/admin/admin.service");
const admin_routes_1 = require("./modules/admin/admin.routes");
const wallets_service_1 = require("./modules/wallets/wallets.service");
const wallets_routes_1 = require("./modules/wallets/wallets.routes");
const reviews_repository_1 = require("./modules/reviews/reviews.repository");
const reviews_service_1 = require("./modules/reviews/reviews.service");
const reviews_routes_1 = require("./modules/reviews/reviews.routes");
const reports_repository_1 = require("./modules/reports/reports.repository");
const reports_service_1 = require("./modules/reports/reports.service");
const reports_routes_1 = require("./modules/reports/reports.routes");
const frontend_service_1 = require("./modules/frontend/frontend.service");
const frontend_routes_1 = require("./modules/frontend/frontend.routes");
function createApp() {
    const app = (0, express_1.default)();
    const auditService = new audit_service_1.AuditService(prisma_1.prisma);
    const emailService = new email_service_1.EmailService();
    const clerkService = new clerk_service_1.ClerkService();
    const googleAuthService = new google_auth_service_1.GoogleAuthService();
    const authSecurityService = new auth_security_service_1.AuthSecurityService(redis_1.redis);
    const javaFinanceClient = new java_finance_client_1.JavaFinanceClient();
    const pythonClient = new python_intelligence_client_1.PythonIntelligenceClient();
    const streamingProviderClient = new streaming_provider_client_1.StreamingProviderClient();
    const authService = new auth_service_1.AuthService(prisma_1.prisma, new auth_repository_1.AuthRepository(prisma_1.prisma), auditService, emailService, clerkService, googleAuthService, authSecurityService);
    const accessService = new access_service_1.AccessService(prisma_1.prisma, auditService, javaFinanceClient, pythonClient);
    const usersService = new users_service_1.UsersService(new users_repository_1.UsersRepository(prisma_1.prisma), auditService, pythonClient);
    const creatorsService = new creators_service_1.CreatorsService(new creators_repository_1.CreatorsRepository(prisma_1.prisma), auditService, pythonClient);
    const categoriesService = new categories_service_1.CategoriesService(new categories_repository_1.CategoriesRepository(prisma_1.prisma), redis_1.redis);
    const liveSessionsService = new live_sessions_service_1.LiveSessionsService(new live_sessions_repository_1.LiveSessionsRepository(prisma_1.prisma), accessService, auditService, pythonClient, streamingProviderClient);
    const premiumContentService = new premium_content_service_1.PremiumContentService(new premium_content_repository_1.PremiumContentRepository(prisma_1.prisma), accessService, auditService, pythonClient);
    const classesService = new classes_service_1.ClassesService(new classes_repository_1.ClassesRepository(prisma_1.prisma), accessService, auditService, pythonClient);
    const notificationsService = new notifications_service_1.NotificationsService(new notifications_repository_1.NotificationsRepository(prisma_1.prisma), auditService);
    const walletsService = new wallets_service_1.WalletsService(javaFinanceClient, auditService);
    const reviewsService = new reviews_service_1.ReviewsService(new reviews_repository_1.ReviewsRepository(prisma_1.prisma), auditService);
    const reportsService = new reports_service_1.ReportsService(new reports_repository_1.ReportsRepository(prisma_1.prisma), auditService, pythonClient);
    const adminService = new admin_service_1.AdminService(new admin_repository_1.AdminRepository(prisma_1.prisma), auditService, pythonClient, javaFinanceClient);
    const frontendService = new frontend_service_1.FrontendService(prisma_1.prisma, authService, accessService, javaFinanceClient, walletsService, liveSessionsService);
    // Railway/Vercel sit behind a reverse proxy, and auth throttling depends on the original client IP.
    app.set("trust proxy", 1);
    app.use(request_context_1.requestContext);
    app.use(logger_1.httpLogger);
    app.use((0, cors_1.default)({
        origin: cors_2.corsOriginDelegate,
        credentials: cors_2.corsCredentials
    }));
    app.use((0, helmet_1.default)());
    app.use((0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        limit: 200,
        standardHeaders: true,
        legacyHeaders: false
    }));
    app.use(express_1.default.json({ limit: "1mb" }));
    if (env_1.env.SWAGGER_ENABLED) {
        app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup((0, swagger_1.createSwaggerDocument)()));
    }
    app.get("/", (_req, res) => {
        res.json({
            service: "livegate-nodejs-service",
            version: "1.0.0"
        });
    });
    app.use("/api", (0, frontend_routes_1.createFrontendRouter)(frontendService));
    app.use("/health", (0, health_routes_1.createHealthRouter)(prisma_1.prisma, redis_1.redis, {
        javaFinance: javaFinanceClient,
        pythonIntelligence: pythonClient
    }));
    const api = express_1.default.Router();
    api.use("/auth", (0, auth_routes_1.createAuthRouter)(authService));
    api.use("/users", (0, users_routes_1.createUsersRouter)(usersService));
    api.use("/creators", (0, creators_routes_1.createCreatorsRouter)(creatorsService));
    api.use("/categories", (0, categories_routes_1.createCategoriesRouter)(categoriesService));
    api.use("/access", (0, access_routes_1.createAccessRouter)(accessService));
    api.use("/lives", (0, live_sessions_routes_1.createLiveSessionsRouter)(liveSessionsService));
    api.use("/content", (0, premium_content_routes_1.createPremiumContentRouter)(premiumContentService));
    api.use("/classes", (0, classes_routes_1.createClassesRouter)(classesService));
    api.use("/notifications", (0, notifications_routes_1.createNotificationsRouter)(notificationsService));
    api.use("/wallets", (0, wallets_routes_1.createWalletsRouter)(walletsService));
    api.use("/reviews", (0, reviews_routes_1.createReviewsRouter)(reviewsService));
    api.use("/reports", (0, reports_routes_1.createReportsRouter)(reportsService));
    api.use("/admin", (0, admin_routes_1.createAdminRouter)(adminService));
    app.use(domain_1.API_PREFIX, api);
    app.use(error_handler_1.errorHandler);
    return app;
}
