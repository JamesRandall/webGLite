export class TemporalValue {
  private currentValue: number
  private minValue: number
  private maxValue: number
  private acceleration: number
  private targetValue: number
  private dampsToZero: boolean
  private lastUpdated: number
  private isSettingTarget: boolean

  constructor(startingValue: number, minValue: number, maxValue: number, acceleration: number, dampsToZero: boolean) {
    this.currentValue = startingValue
    this.targetValue = startingValue
    this.minValue = minValue
    this.maxValue = maxValue
    this.acceleration = acceleration
    this.dampsToZero = dampsToZero
    this.lastUpdated = 0
    this.isSettingTarget = false
  }

  public setTargetValue(value: number) {
    if (this.currentValue != value) {
      this.isSettingTarget = true
      this.targetValue = value
    }
  }

  public update(timeDelta: number) {
    if (this.isSettingTarget && this.currentValue !== this.targetValue) {
      const delta = this.acceleration * timeDelta
      if (this.currentValue < this.targetValue) {
        if (delta < this.targetValue - this.currentValue) {
          this.currentValue = this.targetValue
        } else {
          this.currentValue += delta
        }
      }

      if (this.currentValue > this.targetValue) {
        if (delta > this.currentValue - this.targetValue) {
          this.currentValue = this.targetValue
        } else {
          this.currentValue -= delta
        }
      }
    }

    if (this.targetValue === this.currentValue && this.currentValue !== 0 && this.dampsToZero) {
      this.setTargetValue(0)
    }
  }
}
