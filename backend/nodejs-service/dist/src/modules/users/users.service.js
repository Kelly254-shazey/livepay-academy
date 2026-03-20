"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const app_error_1 = require("../../common/errors/app-error");
class UsersService {
    repository;
    auditService;
    pythonClient;
    constructor(repository, auditService, pythonClient) {
        this.repository = repository;
        this.auditService = auditService;
        this.pythonClient = pythonClient;
    }
    async getMe(userId) {
        const user = await this.repository.getUserProfile(userId);
        if (!user) {
            throw new app_error_1.AppError("User not found.", 404);
        }
        return user;
    }
    updateMe(userId, data) {
        return this.repository.updateUserProfile(userId, data);
    }
    async followCreator(followerId, creatorId) {
        if (followerId === creatorId) {
            throw new app_error_1.AppError("You cannot follow yourself.", 400);
        }
        return this.repository.createFollow(followerId, creatorId);
    }
    async unfollowCreator(followerId, creatorId) {
        await this.repository.deleteFollow(followerId, creatorId);
    }
    updateNotificationPreferences(userId, preferences) {
        return this.repository.updateNotificationPreferences(userId, preferences);
    }
    listPurchaseHistory(userId) {
        return this.repository.listPurchaseHistory(userId);
    }
    async getRecommendations(userId) {
        return this.pythonClient.getCreatorRecommendations(userId);
    }
}
exports.UsersService = UsersService;
