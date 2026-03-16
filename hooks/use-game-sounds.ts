"use client"

import { useCallback, useRef, useEffect } from "react"
import { useAppStore } from "@/lib/store"

// Sound URLs - using free sound effects from online sources
const SOUNDS = {
  // Background music - calm study music
  bgMusic: "https://assets.mixkit.co/music/preview/mixkit-just-relax-5.mp3",
  // Correct answer sound
  correct: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
  // Wrong answer sound  
  wrong: "https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3",
  // Click/select sound
  click: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  // Game start
  gameStart: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  // Timer tick
  tick: "https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3",
}

export function useGameSounds() {
  const { settings } = useAppStore()
  const bgMusicRef = useRef<HTMLAudioElement | null>(null)
  const soundsEnabled = settings.soundEnabled

  // Initialize background music
  useEffect(() => {
    if (typeof window !== "undefined") {
      bgMusicRef.current = new Audio(SOUNDS.bgMusic)
      bgMusicRef.current.loop = true
      bgMusicRef.current.volume = 0.2 // Low volume for background
    }
    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause()
        bgMusicRef.current = null
      }
    }
  }, [])

  const playSound = useCallback((soundType: keyof typeof SOUNDS) => {
    if (!soundsEnabled) return
    
    try {
      const audio = new Audio(SOUNDS[soundType])
      audio.volume = soundType === "bgMusic" ? 0.2 : 0.5
      audio.play().catch(() => {
        // Silently fail if autoplay is blocked
      })
    } catch {
      // Silently fail
    }
  }, [soundsEnabled])

  const playCorrect = useCallback(() => {
    playSound("correct")
  }, [playSound])

  const playWrong = useCallback(() => {
    playSound("wrong")
  }, [playSound])

  const playClick = useCallback(() => {
    playSound("click")
  }, [playSound])

  const playGameStart = useCallback(() => {
    playSound("gameStart")
  }, [playSound])

  const playTick = useCallback(() => {
    playSound("tick")
  }, [playSound])

  const startBgMusic = useCallback(() => {
    if (!soundsEnabled || !bgMusicRef.current) return
    bgMusicRef.current.play().catch(() => {
      // Silently fail if autoplay is blocked
    })
  }, [soundsEnabled])

  const stopBgMusic = useCallback(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.pause()
      bgMusicRef.current.currentTime = 0
    }
  }, [])

  const toggleBgMusic = useCallback(() => {
    if (!bgMusicRef.current) return
    
    if (bgMusicRef.current.paused) {
      bgMusicRef.current.play().catch(() => {})
    } else {
      bgMusicRef.current.pause()
    }
  }, [])

  const isBgMusicPlaying = useCallback(() => {
    return bgMusicRef.current ? !bgMusicRef.current.paused : false
  }, [])

  return {
    playCorrect,
    playWrong,
    playClick,
    playGameStart,
    playTick,
    startBgMusic,
    stopBgMusic,
    toggleBgMusic,
    isBgMusicPlaying,
  }
}
