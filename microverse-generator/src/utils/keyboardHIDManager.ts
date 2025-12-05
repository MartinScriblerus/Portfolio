/**
 * Unified Keyboard HID Manager
 * Connects WebChucK HID to both microtonal keyboard and full MIDI keyboard
 */

import type { HID } from 'webchuck';
import type { Chuck } from 'webchuck';

export interface KeyboardTrigger {
  noteOn: (midiNote: number, velocity: number, hz?: number) => void;
  noteOff: (midiNote: number) => void;
}

// Standard QWERTY keyboard to MIDI note mapping (2 octaves)
// Row 1: 2-9 (C#4 to G#4)
// Row 2: Q-P (C4 to B4)
// Row 3: Z-M (C3 to B3)
const KEYBOARD_MAP: Record<string, number> = {
  // Top row (numbers)
  '2': 61, '3': 63, '4': 64, '5': 66, '6': 68, '7': 70, '8': 71, '9': 73,
  // Middle row (letters)
  'q': 60, 'w': 62, 'e': 64, 'r': 65, 't': 67, 'y': 69, 'u': 71, 'i': 72, 'o': 74, 'p': 76,
  // Bottom row (letters)
  'z': 48, 'x': 50, 'c': 52, 'v': 53, 'b': 55, 'n': 57, 'm': 59,
  // Shift variants (for sharps/flats)
  'Q': 60, 'W': 62, 'E': 64, 'R': 65, 'T': 67, 'Y': 69, 'U': 71, 'I': 72, 'O': 74, 'P': 76,
  'Z': 48, 'X': 50, 'C': 52, 'V': 53, 'B': 55, 'N': 57, 'M': 59,
};

// Track currently pressed keys
const pressedKeys = new Set<number>();
// Global callback for pressed keys updates (for UI feedback)
let pressedKeysCallback: ((keys: Set<number>) => void) | null = null;

export class KeyboardHIDManager {
  private hid: HID | null = null;
  private chuck: Chuck | null = null;
  private triggers: KeyboardTrigger[] = [];
  private isEnabled = true;
  private inputFocused = false;

  /**
   * Get currently pressed MIDI notes
   */
  getPressedKeys(): Set<number> {
    return new Set(pressedKeys);
  }

  /**
   * Register callback for pressed keys updates (for UI feedback)
   */
  onPressedKeysChange(callback: (keys: Set<number>) => void) {
    pressedKeysCallback = callback;
  }

  constructor(chuck: Chuck, hid: HID) {
    this.chuck = chuck;
    this.hid = hid;
    this.setupInputFocusHandlers();
  }

  /**
   * Register a keyboard trigger (for microtonal or full keyboard)
   */
  registerTrigger(trigger: KeyboardTrigger) {
    this.triggers.push(trigger);
  }

  /**
   * Remove a keyboard trigger
   */
  unregisterTrigger(trigger: KeyboardTrigger) {
    const index = this.triggers.indexOf(trigger);
    if (index > -1) {
      this.triggers.splice(index, 1);
    }
  }

  /**
   * Enable/disable HID based on input focus
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled && this.hid) {
      // Release all currently pressed keys when disabled
      pressedKeys.forEach(midiNote => {
        this.triggerNoteOff(midiNote);
      });
      pressedKeys.clear();
    }
  }

  /**
   * Check if HID is currently enabled
   */
  getEnabled(): boolean {
    return this.isEnabled && !this.inputFocused;
  }

  /**
   * Setup handlers to disable HID when inputs are focused
   */
  private setupInputFocusHandlers() {
    // Disable HID when any input/textarea/select is focused
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        this.inputFocused = true;
        this.setEnabled(false);
      }
    };

    // Re-enable HID when focus leaves inputs
    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Small delay to allow for tab navigation
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (
            !activeElement ||
            (activeElement.tagName !== 'INPUT' &&
             activeElement.tagName !== 'TEXTAREA' &&
             activeElement.tagName !== 'SELECT' &&
             !activeElement.isContentEditable)
          ) {
            this.inputFocused = false;
            this.setEnabled(true);
          }
        }, 100);
      }
    };

    // Re-enable when clicking on window (not an input)
    const handleWindowFocus = () => {
      const activeElement = document.activeElement;
      if (
        !activeElement ||
        (activeElement.tagName !== 'INPUT' &&
         activeElement.tagName !== 'TEXTAREA' &&
         activeElement.tagName !== 'SELECT' &&
         !activeElement.isContentEditable)
      ) {
        this.inputFocused = false;
        this.setEnabled(true);
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Cleanup on destroy
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }

  /**
   * Handle key press from HID
   */
  async handleKeyPress(key: string, velocity: number = 100) {
    if (!this.getEnabled()) return;

    const midiNote = KEYBOARD_MAP[key.toLowerCase()];
    if (midiNote && !pressedKeys.has(midiNote)) {
      pressedKeys.add(midiNote);
      this.triggerNoteOn(midiNote, velocity);
      // Notify UI of pressed keys change
      if (pressedKeysCallback) {
        pressedKeysCallback(new Set(pressedKeys));
      }
    }
  }

  /**
   * Handle key release from HID
   */
  async handleKeyRelease(key: string) {
    if (!this.getEnabled()) return;

    const midiNote = KEYBOARD_MAP[key.toLowerCase()];
    if (midiNote && pressedKeys.has(midiNote)) {
      pressedKeys.delete(midiNote);
      this.triggerNoteOff(midiNote);
      // Notify UI of pressed keys change
      if (pressedKeysCallback) {
        pressedKeysCallback(new Set(pressedKeys));
      }
    }
  }

  /**
   * Trigger note on for all registered triggers and send to ChucK
   */
  private async triggerNoteOn(midiNote: number, velocity: number, hz?: number) {
    // Send directly to ChucK via global variables and events
    if (this.chuck) {
      try {
        await this.chuck.setInt('hidMidiNote', midiNote);
        await this.chuck.setInt('hidVelocity', velocity);
        if (hz) {
          await this.chuck.setFloat('hidFreq', hz);
        } else {
          // Calculate frequency from MIDI note
          const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
          await this.chuck.setFloat('hidFreq', freq);
        }
        await this.chuck.broadcastEvent('hidNoteOn');
        console.log(`[HID] Note ON: MIDI ${midiNote}, vel ${velocity}`);
      } catch (err) {
        console.warn('Error sending HID noteOn to ChucK:', err);
      }
    }
    
    // Also trigger registered callbacks (for UI feedback)
    this.triggers.forEach(trigger => {
      try {
        trigger.noteOn(midiNote, velocity, hz);
      } catch (err) {
        console.warn('Error in keyboard trigger noteOn:', err);
      }
    });
  }

  /**
   * Trigger note off for all registered triggers and send to ChucK
   */
  private async triggerNoteOff(midiNote: number) {
    // Send directly to ChucK
    if (this.chuck) {
      try {
        await this.chuck.setInt('hidMidiNote', midiNote);
        await this.chuck.broadcastEvent('hidNoteOff');
        console.log(`[HID] Note OFF: MIDI ${midiNote}`);
      } catch (err) {
        console.warn('Error sending HID noteOff to ChucK:', err);
      }
    }
    
    // Also trigger registered callbacks
    this.triggers.forEach(trigger => {
      try {
        trigger.noteOff(midiNote);
      } catch (err) {
        console.warn('Error in keyboard trigger noteOff:', err);
      }
    });
  }

  /**
   * Setup ChucK code to listen for HID keyboard events
   * Note: WebChucK HID works via JavaScript event listeners, not ChucK code
   */
  async setupChuckHIDListener() {
    // HID is already set up via JavaScript event listeners in WebChucK
    // This method is kept for compatibility but doesn't need to do anything
    console.log('✅ HID keyboard listener ready (handled by WebChucK)');
  }

  /**
   * Start listening for keyboard events via JavaScript
   * WebChucK HID automatically captures keyboard events, but we need to
   * also listen directly for better integration
   */
  async startListening() {
    // Set up direct JavaScript keyboard event listeners as a fallback
    // The HID class in WebChucK handles the ChucK side, but we also want
    // to handle it on the JavaScript side for immediate feedback
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!this.getEnabled()) return;
      // Prevent default only for our mapped keys
      if (KEYBOARD_MAP[e.key.toLowerCase()]) {
        e.preventDefault();
        this.handleKeyPress(e.key, 100);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!this.getEnabled()) return;
      if (KEYBOARD_MAP[e.key.toLowerCase()]) {
        e.preventDefault();
        this.handleKeyRelease(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Store cleanup function
    (this as any)._cleanupKeyboardListeners = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };

    console.log('✅ JavaScript keyboard listeners active');
  }

  /**
   * Cleanup
   */
  destroy() {
    pressedKeys.forEach(midiNote => {
      this.triggerNoteOff(midiNote);
    });
    pressedKeys.clear();
    this.triggers = [];
    
    // Cleanup keyboard listeners
    if ((this as any)._cleanupKeyboardListeners) {
      (this as any)._cleanupKeyboardListeners();
    }
    
    this.hid = null;
    this.chuck = null;
  }
}

