"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingProviderClient = void 0;
const env_1 = require("../../config/env");
class StreamingProviderClient {
    buildRoom(input) {
        const baseUrl = env_1.env.STREAMING_PROVIDER_BASE_URL.replace(/\/+$/, "");
        return {
            provider: "livegate-streaming-placeholder",
            roomId: input.roomId,
            visibility: input.visibility,
            publishUrl: `${baseUrl}/publish/${input.roomId}`,
            playbackUrl: `${baseUrl}/play/${input.roomId}`,
            controlUrl: `${baseUrl}/internal/rooms/${input.liveSessionId}`
        };
    }
}
exports.StreamingProviderClient = StreamingProviderClient;
