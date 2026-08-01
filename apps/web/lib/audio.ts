class NotificationSound {
  private audio: HTMLAudioElement | null = null;

  private get instance() {
    if (!this.audio) {
      this.audio = new Audio("/sounds/parrot_notification.wav");
      this.audio.volume = 1;
    }
    return this.audio;
  }
  play() {
    const a = this.instance;
    a.currentTime = 0;
    a.play().catch(() => {
      console.log("failed to play");
    });
  }

  speak(text: string) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.warn(error)
    }
  }
}

export const notificationSound = new NotificationSound();
