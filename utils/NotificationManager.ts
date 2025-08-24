export class NotificationManager {
  private static instance: NotificationManager;

  private constructor() { }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  private async playCustomSound(soundPath: string, volume: number = 0.7): Promise<void> {
    try {
      const audio = new Audio(soundPath);
      audio.volume = volume;
      await audio.play();
    } catch (audioError) {
      console.log("Custom audio failed:", audioError);
    }
  }

  private async playAlertSound(): Promise<void> {
    try {
      const audio = new Audio("/sounds/alert.mp3");
      audio.volume = 0.7;
      await audio.play();
    } catch (error) {
      console.log("Audio play failed:", error);
    }
  }

  private async showFallbackNotification(title?: string, body?: string): Promise<void> {
    new Notification(title || 'title', {
      body: body || "",
      icon: "/icons/ith.png",
    });
    await this.playAlertSound();
  }

  async showNotification(
    permission: string,
    isPushEnabled: boolean,
    notificationSetting?: boolean,
    title?: string,
    body?: string
  ): Promise<void> {
    if (typeof window === "undefined") return;
    if (permission !== "granted" || !isPushEnabled) return;
    if (!notificationSetting) return;

    const isIOS = this.isIOS();

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const notificationOptions = {
            body: body || "",
            icon: "/icons/ith.png",
            silent: !isIOS,
            data: { playSound: true }
          };
          await registration.showNotification(title || 'title', notificationOptions);

          if (!isIOS) {
            await this.playAlertSound();
          }
          return;
        }
      }

      await this.showFallbackNotification(title, body);
    } catch (error) {
      console.error("Notification failed:", error);
    }
  }
}