const logOutput = document.getElementById("game-console") as HTMLDivElement

export function log(message: string) {
  const logItem = document.createElement("div")
  logItem.style.padding = "3px"
  logItem.style.color = "rgb(0,255,0)"
  logItem.innerText = message
  logOutput.insertAdjacentElement("afterbegin", logItem)
}
