const logOutput = document.getElementById("game-console") as HTMLDivElement

const maxHistory = 200

export function log(message: string) {
  const logItem = document.createElement("div")
  logItem.style.padding = "3px"
  logItem.style.color = "rgb(0,255,0)"
  logItem.innerText = message
  if (logOutput.children.length === maxHistory) {
    logOutput.children[maxHistory - 1].remove()
  }
  logOutput.insertAdjacentElement("afterbegin", logItem)
}
