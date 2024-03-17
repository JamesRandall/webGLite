import { ResourceLoadedFunc } from "./resources/resources"

type AudioPlayer = (volume?: number) => void

export interface SoundEffects {
  bootUp: AudioPlayer
  docked: AudioPlayer
  enemyLaserHit: AudioPlayer
  enemyLaserMiss: AudioPlayer
  hyperspace: AudioPlayer
  jumpBlocked: AudioPlayer
  launch: AudioPlayer
  playerLaserHit: AudioPlayer
  playerLaserMiss: AudioPlayer
  shipExplosion: AudioPlayer
  ecm: AudioPlayer
  energyBomb: AudioPlayer
  danube: AudioPlayer
  missileTarget: AudioPlayer
  missileLaunch: AudioPlayer
}

function createSingleAudioPlayer(path: string): Promise<HTMLAudioElement> {
  return new Promise((resolve) => {
    const player = new Audio(path)
    player.addEventListener("canplaythrough", () => resolve(player), false)
  })
}

async function createAudioPlayer(path: string, resourceLoaded: ResourceLoadedFunc) {
  const playerPromises: Promise<HTMLAudioElement>[] = []
  for (let i = 0; i < 10; i++) {
    playerPromises.push(createSingleAudioPlayer(path))
  }
  const players = await Promise.all(playerPromises)
  let currentIndex = 0
  resourceLoaded()
  return function (volume: number = 1.0) {
    players[currentIndex].volume = volume
    try {
      players[currentIndex].play()
    } catch {}
    currentIndex++
    if (currentIndex >= players.length) currentIndex = 0
  }
}

const filenames = [
  "audio/BBC Boot Sound.mp3",
  "audio/Docked.mp3",
  "audio/Enemy Laser Hit.mp3",
  "audio/Enemy Laser Miss.mp3",
  "audio/Hyperspace.mp3",
  "audio/Jump Blocked.mp3",
  "audio/Launch.mp3",
  "audio/Player Laser Hit.mp3",
  "audio/Player Laser Miss.mp3",
  "audio/Ship Explosion.mp3",
  "audio/ECM.mp3",
  "audio/Energy Bomb.mp3",
  "audio/Danube.mp3",
  "audio/Missile Target.mp3",
  "audio/Missile Launch.mp3",
]

export const numberOfSooundEffects = filenames.length

export async function createSoundEffects(resourceLoaded: ResourceLoadedFunc) {
  const effects = await Promise.all(filenames.map((a) => createAudioPlayer(a, resourceLoaded)))

  return {
    bootUp: effects[0],
    docked: effects[1],
    enemyLaserHit: effects[2],
    enemyLaserMiss: effects[3],
    hyperspace: effects[4],
    jumpBlocked: effects[5],
    launch: effects[6],
    playerLaserHit: effects[7],
    playerLaserMiss: effects[8],
    shipExplosion: effects[9],
    ecm: effects[10],
    energyBomb: effects[11],
    danube: effects[12],
    missileTarget: effects[13],
    missileLaunch: effects[14],
  } as SoundEffects
}
