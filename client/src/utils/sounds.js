export const playPing = (user) => {
  if (user?.preferences?.sounds?.enabled !== false) {
    // Premium notification sound URL
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  }
};
