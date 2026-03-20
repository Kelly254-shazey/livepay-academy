import { env } from "../../config/env";

type BuildStreamingRoomInput = {
  liveSessionId: string;
  roomId: string;
  visibility: "public" | "followers_only" | "private";
};

export class StreamingProviderClient {
  buildRoom(input: BuildStreamingRoomInput) {
    const baseUrl = env.STREAMING_PROVIDER_BASE_URL.replace(/\/+$/, "");

    return {
      provider: "livegate-streaming-placeholder",
      roomId: input.roomId,
      visibility: input.visibility,
      publishUrl: `${baseUrl}/publish/${input.roomId}`,
      playbackUrl: `${baseUrl}/play/${input.roomId}`,
      controlUrl: `${baseUrl}/internal/rooms/${input.liveSessionId}`,
      apiKeyHint: `${env.STREAMING_PROVIDER_API_KEY.slice(0, 4)}***`
    };
  }
}
