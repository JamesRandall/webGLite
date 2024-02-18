/*type AudioPlayer = (volume: number) => void

export interface SoundEffects {
  bootUp: AudioPlayer
  enemyLaserHit: AudioPlayer
  enemyLaserMiss: AudioPlayer
  hyperspace: AudioPlayer
  jumpBlocked: AudioPlayer
  launch: AudioPlayer
  playerLaserHit: AudioPlayer
  playerLaserMiss: AudioPlayer
  shipExplosion: AudioPlayer
}*/

function createAudioPlayer(path: string) {
  const players: HTMLAudioElement[] = []
  for (let i = 0; i < 4; i++) {
    const player = new Audio(path)
    players.push(player)
  }
  let currentIndex = 0
  return function (volume: number = 1.0) {
    players[currentIndex].volume = volume
    players[currentIndex].play()
    currentIndex++
    if (currentIndex >= players.length) currentIndex = 0
  }
}

export const soundEffect = {
  bootUp: createAudioPlayer("audio/BBC Boot Sound.mp3"),
  docked: createAudioPlayer("audio/Docked.mp3"),
  enemyLaserHit: createAudioPlayer("audio/Enemy Laser Hit.mp3"),
  enemyLaserMiss: createAudioPlayer("audio/Enemy Laser Miss.mp3"),
  hyperspace: createAudioPlayer("audio/Hyperspace.mp3"),
  jumpBlocked: createAudioPlayer("audio/Jump Blocked.mp3"),
  launch: createAudioPlayer("audio/Launch.mp3"),
  playerLaserHit: createAudioPlayer("audio/Player Laser Hit.mp3"),
  playerLaserMiss: createAudioPlayer("audio/Player Laser Miss.mp3"),
  shipExplosion: createAudioPlayer("audio/Ship Explosion.mp3"),
}
