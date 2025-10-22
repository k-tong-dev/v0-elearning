"use client"

import React, { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import {
    MediaController,
    MediaControlBar,
    MediaTimeRange,
    MediaTimeDisplay,
    MediaVolumeRange,
    MediaPlaybackRateButton,
    MediaPlayButton,
    MediaSeekBackwardButton,
    MediaSeekForwardButton,
    MediaMuteButton,
    MediaFullscreenButton,
    MediaCaptionsButton,
    MediaPreviewTimeDisplay,
    MediaLiveButton,
    MediaAirplayButton,
    MediaTextDisplay,
    MediaCastButton,
    MediaContainer,
    MediaChromeRange,
    MediaPreviewChapterDisplay,
    MediaTooltip,
    MediaDurationDisplay,
    MediaPipButton,
    MediaLoadingIndicator,
    MediaGestureReceiver,
    MediaPreviewThumbnail,
    MediaPosterImage,
    MediaErrorDialog,
    MediaChromeDialog

} from "media-chrome/react";

interface VideoAudioPreviewProps {
    url: string;
    contentTypes: "video" | "audio";
    isPlaying: boolean;
    onError: (error: string) => void;
    onReady: () => void;
    onProgress: (state: { playedSeconds: number, played: number }) => void;
}

export function ContentPreviewer({ url, contentTypes, isPlaying, onError, onReady, onProgress }: VideoAudioPreviewProps) {
    const [playerError, setPlayerError] = useState<string | null>(null);

    const handleError = (e: any) => {
        console.error("ReactPlayer error:", e);
        const errorMsg = e.toString().includes("embedding")
            ? "Embedding is disabled for this video. Try a different URL."
            : "Failed to load media. Check the URL or network.";
        setPlayerError(errorMsg);
        onError(errorMsg);
    };

    if (playerError) {
        return <div className="flex items-center justify-center w-full h-full bg-red-100 text-red-600 p-4">{playerError}</div>;
    }

    return (
        <div className="relative w-full h-full min-h-[200px]">
            <MediaController
                style={{
                    width: "100%",
                    aspectRatio: "16/9",
                }}
            >
                <ReactPlayer
                    slot="media"
                    src={url}
                    controls={false}
                    autoplay={true}
                    loop={true}
                    style={{
                        width: "100%",
                        height: "100%",
                        "--controls": "none",
                    }}
                >
                    <track kind="subtitles" src="subtitles.en.vtt" srcLang="en" default/>
                    <track kind="subtitles" src="subs/subtitles.ja.vtt" srcLang="kh"/>
                </ReactPlayer>

                <MediaControlBar>
                    <MediaPlayButton />
                    <MediaSeekBackwardButton seekOffset={5} />
                    <MediaSeekForwardButton seekOffset={5} />
                    <MediaTimeRange />
                    <MediaTimeDisplay showDuration />
                    <MediaMuteButton />
                    <MediaVolumeRange />
                    <MediaPlaybackRateButton />
                    <MediaFullscreenButton />

                    <MediaCaptionsButton />
                    <MediaPipButton />
                    <MediaChromeDialog />
                </MediaControlBar>
            </MediaController>
        </div>
    );
}