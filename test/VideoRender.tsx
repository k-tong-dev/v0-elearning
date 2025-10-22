import React from "react"
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

export function Player() {
    const handleError = (e: any) => {
        console.error("ReactPlayer error:", e);
        const errorMsg = e.toString().includes("embedding")
            ? "Embedding is disabled for this video. Try a different URL."
            : "Failed to load media. Check the URL or network.";
    };
    return (
        <MediaController
            style={{
                width: "100%",
                aspectRatio: "16/9",
            }}
        >
            <ReactPlayer
                slot="media"
                // src="https://stream.mux.com/maVbJv2GSYNRgS02kPXOOGdJMWGU1mkA019ZUjYE7VU7k"
                src={"https://res.cloudinary.com/dpf3zv351/video/upload/v1761111084/elearning-into_mrqwdg.mp4"}
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
                <MediaCastButton />
                <MediaAirplayButton />
                <MediaContainer />
                <MediaTooltip />
                <MediaDurationDisplay />
                <MediaPipButton />
                <MediaGestureReceiver />
                <MediaPreviewThumbnail />
                <MediaPosterImage />
                <MediaErrorDialog onError={handleError} />
                <MediaChromeDialog />

                <MediaLoadingIndicator />

                <MediaPreviewChapterDisplay />
                <MediaChromeRange />
                <MediaTextDisplay/>
                <MediaPreviewChapterDisplay />

            </MediaControlBar>
        </MediaController>
    );
}


export function SourceTracking() {
    return (
        <ReactPlayer
            controls
            // slot={"media"}
            // src="https://stream.mux.com/maVbJv2GSYNRgS02kPXOOGdJMWGU1mkA019ZUjYE7VU7k"

            src={"https://res.cloudinary.com/dpf3zv351/video/upload/v1761111084/elearning-into_mrqwdg.mp4"}
            // src={"https://res.cloudinary.com/dpf3zv351/video/upload/v1761051642/gaze-of-the-blade_jilgoe.mp4"}
            autoPlay={true}
            loop={true}

            style={{
                width: "100%",
                height: "100%",
                // "--controls": "none",
            }}
        >
            <track kind="subtitles" src="subs/subtitles.en.vtt" srcLang="en"/>
            <track kind="subtitles" src="subs/subtitles.kh.vtt" srcLang="kh"/>
        </ReactPlayer>
    );
}
