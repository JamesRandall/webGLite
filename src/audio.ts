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
}

function createSingleAudioPlayer(path: string): Promise<HTMLAudioElement> {
  return new Promise((resolve) => {
    const player = new Audio(path)
    player.addEventListener("canplaythrough", () => resolve(player), false)
  })
}

async function createAudioPlayer(path: string) {
  const players: HTMLAudioElement[] = []
  for (let i = 0; i < 4; i++) {
    players.push(await createSingleAudioPlayer(path))
  }
  let currentIndex = 0
  return function (volume: number = 1.0) {
    players[currentIndex].volume = volume
    players[currentIndex].play()
    currentIndex++
    if (currentIndex >= players.length) currentIndex = 0
  }
}

export async function createSoundEffects() {
  return {
    bootUp: await createAudioPlayer("audio/BBC Boot Sound.mp3"),
    docked: await createAudioPlayer("audio/Docked.mp3"),
    enemyLaserHit: await createAudioPlayer("audio/Enemy Laser Hit.mp3"),
    enemyLaserMiss: await createAudioPlayer("audio/Enemy Laser Miss.mp3"),
    hyperspace: await createAudioPlayer("audio/Hyperspace.mp3"),
    jumpBlocked: await createAudioPlayer("audio/Jump Blocked.mp3"),
    launch: await createAudioPlayer("audio/Launch.mp3"),
    playerLaserHit: await createAudioPlayer("audio/Player Laser Hit.mp3"),
    playerLaserMiss: await createAudioPlayer("audio/Player Laser Miss.mp3"),
    shipExplosion: await createAudioPlayer("audio/Ship Explosion.mp3"),
  } as SoundEffects
}
