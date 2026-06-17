import { describe, it, expect } from 'vitest';
import { isAudioFile, isImageFile, isCoverImage } from '@/lib/repository/local';

describe('LocalAdapter utilities', () => {
  describe('isAudioFile', () => {
    it('detects supported audio formats', () => {
      expect(isAudioFile('track.mp3')).toBe(true);
      expect(isAudioFile('audio.m4a')).toBe(true);
      expect(isAudioFile('song.flac')).toBe(true);
      expect(isAudioFile('recording.wav')).toBe(true);
      expect(isAudioFile('voice.ogg')).toBe(true);
    });

    it('rejects non-audio files', () => {
      expect(isAudioFile('cover.jpg')).toBe(false);
      expect(isAudioFile('readme.txt')).toBe(false);
      expect(isAudioFile('video.mp4')).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(isAudioFile('Track.MP3')).toBe(true);
      expect(isAudioFile('SONG.FLAC')).toBe(true);
    });
  });

  describe('isImageFile', () => {
    it('detects image formats', () => {
      expect(isImageFile('cover.jpg')).toBe(true);
      expect(isImageFile('artwork.png')).toBe(true);
      expect(isImageFile('photo.webp')).toBe(true);
    });

    it('rejects non-image files', () => {
      expect(isImageFile('track.mp3')).toBe(false);
    });
  });

  describe('isCoverImage', () => {
    it('matches cover patterns', () => {
      expect(isCoverImage('cover.jpg')).toBe(true);
      expect(isCoverImage('Cover.PNG')).toBe(true);
      expect(isCoverImage('folder.jpg')).toBe(true);
      expect(isCoverImage('jacket.png')).toBe(true);
      expect(isCoverImage('front.jpeg')).toBe(true);
    });

    it('rejects non-cover images', () => {
      expect(isCoverImage('screenshot.png')).toBe(false);
      expect(isCoverImage('photo.jpg')).toBe(false);
    });
  });
});
