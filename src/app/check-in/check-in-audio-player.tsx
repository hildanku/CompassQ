'use client'

import { useEffect, useRef, useState } from 'react'

function formatAudioTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '0:00'
    }

    const wholeSeconds = Math.floor(seconds)
    const minutes = Math.floor(wholeSeconds / 60)
    const remainingSeconds = wholeSeconds % 60

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export function CheckInAudioPlayer({
    ayahKey,
    audioUrl,
}: {
    ayahKey: string
    audioUrl: string | null
}) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [audioCurrentTime, setAudioCurrentTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)
    const [isAudioPlaying, setIsAudioPlaying] = useState(false)
    const [hasAudioPlaybackError, setHasAudioPlaybackError] = useState(false)

    useEffect(() => {
        const audio = audioRef.current

        if (!audio || !audioUrl) {
            return
        }

        const syncCurrentTime = () => {
            setAudioCurrentTime(audio.currentTime)
        }

        const syncDuration = () => {
            setAudioDuration(
                Number.isFinite(audio.duration) ? audio.duration : 0,
            )
        }

        const handlePlay = () => {
            setIsAudioPlaying(true)
            setHasAudioPlaybackError(false)
        }

        const handlePause = () => {
            setIsAudioPlaying(false)
        }

        const handleEnded = () => {
            setIsAudioPlaying(false)
            setAudioCurrentTime(audio.duration || 0)
        }

        const handleError = () => {
            setIsAudioPlaying(false)
            setHasAudioPlaybackError(true)
        }

        syncCurrentTime()
        syncDuration()

        audio.addEventListener('timeupdate', syncCurrentTime)
        audio.addEventListener('loadedmetadata', syncDuration)
        audio.addEventListener('durationchange', syncDuration)
        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)

        return () => {
            audio.removeEventListener('timeupdate', syncCurrentTime)
            audio.removeEventListener('loadedmetadata', syncDuration)
            audio.removeEventListener('durationchange', syncDuration)
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
        }
    }, [audioUrl])

    async function handleToggleAudioPlayback() {
        const audio = audioRef.current

        if (!audio) {
            return
        }

        try {
            if (audio.paused) {
                await audio.play()
            } else {
                audio.pause()
            }
        } catch {
            setIsAudioPlaying(false)
            setHasAudioPlaybackError(true)
        }
    }

    function handleSeekAudio(nextTime: number) {
        const audio = audioRef.current

        if (!audio) {
            return
        }

        audio.currentTime = nextTime
        setAudioCurrentTime(nextTime)
    }

    function handleReplayAudio() {
        const audio = audioRef.current

        if (!audio) {
            return
        }

        audio.currentTime = 0
        setAudioCurrentTime(0)
        void audio.play().catch(() => {
            setIsAudioPlaying(false)
            setHasAudioPlaybackError(true)
        })
    }

    const hasAudio = Boolean(audioUrl) && !hasAudioPlaybackError

    if (!hasAudio) {
        return (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-600">
                Recitation is unavailable right now, but the verse remains fully
                readable.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-900">Recitation</p>
            <audio
                ref={audioRef}
                preload="none"
                className="hidden"
                src={audioUrl ?? undefined}
            >
                Your browser does not support audio playback.
            </audio>

            <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-[linear-gradient(180deg,#1f1f1f_0%,#121212_100%)] p-5 text-white shadow-xl shadow-zinc-950/20">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,rgba(29,185,84,0.7),rgba(29,185,84,0.15)_45%,rgba(255,255,255,0.04)_70%)] shadow-lg shadow-black/30">
                            <span className="text-lg font-semibold text-emerald-50">
                                Q
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                                Ayah {ayahKey}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                                Quran Moment Recitation
                            </p>
                        </div>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                        {isAudioPlaying ? 'Playing' : 'Paused'}
                    </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleToggleAudioPlayback}
                        className="rounded-full bg-[#1db954] px-5 py-3 text-sm font-semibold text-[#04130a] transition hover:bg-[#1ed760]"
                    >
                        {isAudioPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReplayAudio}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                    >
                        Replay
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            handleSeekAudio(Math.max(audioCurrentTime - 10, 0))
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                    >
                        Back 10s
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            handleSeekAudio(
                                Math.min(
                                    audioCurrentTime + 10,
                                    audioDuration || audioCurrentTime + 10,
                                ),
                            )
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                    >
                        Forward 10s
                    </button>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                        <span>{formatAudioTime(audioCurrentTime)}</span>
                        <span>{formatAudioTime(audioDuration)}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={Math.max(audioDuration, 0)}
                        step="1"
                        value={Math.min(
                            audioCurrentTime,
                            audioDuration || audioCurrentTime,
                        )}
                        onChange={(event) => {
                            handleSeekAudio(Number(event.target.value))
                        }}
                        className="w-full accent-[#1db954]"
                        aria-label="Seek recitation"
                    />
                </div>
            </div>
        </div>
    )
}
