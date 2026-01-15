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
  private cleanupFocusHandlers: (() => void) | null = null;
  private blurTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private focusDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

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

  /**
   * Unregister callback for pressed keys updates
   * CRITICAL: Call this to prevent holding references to components
   */
  offPressedKeysChange() {
    if (pressedKeysCallback) {
      pressedKeysCallback = null;
    }
  }

  constructor(chuck: Chuck, hid: HID) {
    this.chuck = chuck;
    this.hid = hid;
    // WebChucK HID listeners remain always enabled - we filter events in our custom listeners
    // This avoids memory leaks from repeatedly enabling/disabling listeners
    this.cleanupFocusHandlers = this.setupInputFocusHandlers();
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
   * Note: WebChucK's keyboard listeners remain always enabled to avoid memory leaks.
   * We filter events in our custom listeners based on canvas focus.
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      // Release all currently pressed keys when disabled
      pressedKeys.forEach(midiNote => {
        this.triggerNoteOff(midiNote);
      });
      pressedKeys.clear();
    }
  }

  /**
   * Check if HID is currently enabled
   * Only enabled when canvas is focused and no UI elements are active
   */
  getEnabled(): boolean {
    if (!this.isEnabled) return false;
    if (this.inputFocused) return false;
    // Only enable if canvas is actually focused
    return this.isCanvasFocused();
  }

  /**
   * Check if Babylon canvas or HexKeyboard is the active/focused element
   * Specifically checks for the babylonCanvas element
   */
  private isCanvasFocused(): boolean {
    // First check: Is the Babylon canvas itself focused?
    const babylonCanvas = document.getElementById('babylonCanvas') as HTMLCanvasElement | null;
    if (babylonCanvas && document.activeElement === babylonCanvas) {
      return true;
    }
    
    // Second check: Is any canvas focused? (fallback)
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement) return false;
    
    // Check if active element is a canvas (Babylon canvas)
    if (activeElement.tagName === 'CANVAS') {
      // Verify it's the Babylon canvas specifically
      if (activeElement.id === 'babylonCanvas' || activeElement === babylonCanvas) {
        return true;
      }
    }
    
    // Check if it's inside HexKeyboard (SVG element or its container)
    if (activeElement.closest('svg') || activeElement.closest('[class*="HexKeyboard"]')) {
      return true;
    }
    
    // Also check if canvas is in the active element's parent chain
    // (in case canvas is wrapped in a container)
    let parent = activeElement.parentElement;
    while (parent) {
      if (parent.tagName === 'CANVAS') {
        // Verify it's the Babylon canvas
        if (parent.id === 'babylonCanvas' || parent === babylonCanvas) {
          return true;
        }
      }
      // Check for HexKeyboard container
      if (parent.closest('svg') || parent.closest('[class*="HexKeyboard"]')) {
        return true;
      }
      parent = parent.parentElement;
    }
    
    return false;
  }

  /**
   * Check if a click target is a UI element (button, modal, input, etc.)
   */
  private isUIElement(target: HTMLElement): boolean {
    // Check if it's an input element
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return true;
    }
    
    // Check if it's a button or inside a button
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return true;
    }
    
    // Check if it's inside a modal/dialog
    if (target.closest('[role="dialog"]') || target.closest('.MuiModal-root') || target.closest('[class*="modal"]')) {
      return true;
    }
    
    // Check if it's inside a MUI component that should block HID
    if (target.closest('.MuiButton-root') || 
        target.closest('.MuiTextField-root') ||
        target.closest('.MuiSelect-root') ||
        target.closest('.MuiInputBase-root')) {
      return true;
    }
    
    return false;
  }

  /**
   * Setup handlers to disable HID when inputs are focused or UI elements are clicked
   */
  private setupInputFocusHandlers() {
    // Track canvas focus state
    let canvasFocused = false;
    
    // Debounced focus handler to prevent rapid-fire events
    const debouncedSetEnabled = (enabled: boolean, reason: string) => {
      if (this.focusDebounceTimeout !== null) {
        clearTimeout(this.focusDebounceTimeout);
      }
      this.focusDebounceTimeout = setTimeout(() => {
        this.focusDebounceTimeout = null;
        // Only update if state actually changed
        if (enabled !== this.getEnabled()) {
          this.setEnabled(enabled);
          // Reduced logging for performance - only log state changes
          if (enabled) {
            console.log('[HID] Enabled:', reason);
          } else {
            console.log('[HID] Disabled:', reason);
          }
        }
      }, 50); // 50ms debounce
    };
    
    // Handle canvas focus (when Babylon canvas is clicked)
    const handleCanvasFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const babylonCanvas = document.getElementById('babylonCanvas') as HTMLCanvasElement | null;
      
      // Check specifically for Babylon canvas
      if (target === babylonCanvas || (target.tagName === 'CANVAS' && target.id === 'babylonCanvas')) {
        canvasFocused = true;
        this.inputFocused = false;
        debouncedSetEnabled(true, 'canvas focused');
      }
    };
    
    // Disable HID when any input/textarea/select is focused
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const babylonCanvas = document.getElementById('babylonCanvas') as HTMLCanvasElement | null;
      
      // If Babylon canvas is focused, allow it
      if (target === babylonCanvas || (target.tagName === 'CANVAS' && target.id === 'babylonCanvas')) {
        canvasFocused = true;
        this.inputFocused = false;
        debouncedSetEnabled(true, 'canvas focused');
        return;
      }
      
      // If it's a UI element, disable HID
      if (this.isUIElement(target)) {
        this.inputFocused = true;
        canvasFocused = false;
        debouncedSetEnabled(false, 'UI element focused');
      }
    };

    // Handle clicks to determine if canvas/HexKeyboard or UI element was clicked
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check specifically for Babylon canvas
      const babylonCanvas = document.getElementById('babylonCanvas') as HTMLCanvasElement | null;
      
      // If Babylon canvas was clicked, enable HID
      if (target === babylonCanvas || target.tagName === 'CANVAS' && target.id === 'babylonCanvas') {
        canvasFocused = true;
        this.inputFocused = false;
        // Clear debounce and set immediately for click events
        if (this.focusDebounceTimeout !== null) {
          clearTimeout(this.focusDebounceTimeout);
          this.focusDebounceTimeout = null;
        }
        this.setEnabled(true);
        // Ensure canvas is focusable and focus it
        if (babylonCanvas) {
          if (babylonCanvas.tabIndex === -1) {
            babylonCanvas.tabIndex = 0; // Make it focusable
          }
          babylonCanvas.focus();
        }
        return;
      }
      
      // If HexKeyboard (SVG) was clicked, enable HID
      if (target.tagName === 'svg' || target.closest('svg') || target.closest('[class*="HexKeyboard"]')) {
        canvasFocused = true;
        this.inputFocused = false;
        // Clear debounce and set immediately for click events
        if (this.focusDebounceTimeout !== null) {
          clearTimeout(this.focusDebounceTimeout);
          this.focusDebounceTimeout = null;
        }
        this.setEnabled(true);
        // Focus the Babylon canvas if available
        if (babylonCanvas) {
          if (babylonCanvas.tabIndex === -1) {
            babylonCanvas.tabIndex = 0;
          }
          babylonCanvas.focus();
        } else {
          (target.closest('svg') as SVGElement)?.focus?.();
        }
        return;
      }
      
      // If UI element was clicked, disable HID
      if (this.isUIElement(target)) {
        canvasFocused = false;
        this.inputFocused = true;
        // Clear debounce and set immediately for click events
        if (this.focusDebounceTimeout !== null) {
          clearTimeout(this.focusDebounceTimeout);
          this.focusDebounceTimeout = null;
        }
        this.setEnabled(false);
      }
    };

    // Re-enable HID when focus leaves inputs (but only if canvas is focused)
    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Clear any existing timeout to prevent leaks
        if (this.blurTimeoutId !== null) {
          clearTimeout(this.blurTimeoutId);
        }
        // Small delay to allow for tab navigation
        this.blurTimeoutId = setTimeout(() => {
          this.blurTimeoutId = null; // Clear the ID when timeout fires
          const activeElement = document.activeElement as HTMLElement | null;
          // Only re-enable if canvas is now focused
          if (this.isCanvasFocused()) {
            this.inputFocused = false;
            canvasFocused = true;
            debouncedSetEnabled(true, 'input blurred, canvas focused');
          } else if (
            !activeElement ||
            !this.isUIElement(activeElement)
          ) {
            // If nothing is focused or it's not a UI element, check canvas state
            this.inputFocused = false;
            // Don't auto-enable - wait for canvas click
          }
        }, 100);
      }
    };

    // Re-enable when clicking on window (check if canvas)
    const handleWindowFocus = () => {
      if (this.isCanvasFocused()) {
        this.inputFocused = false;
        canvasFocused = true;
        debouncedSetEnabled(true, 'window focused, canvas active');
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusin', handleCanvasFocus);
    document.addEventListener('focusout', handleBlur);
    document.addEventListener('click', handleClick, true); // Use capture phase to catch early
    window.addEventListener('focus', handleWindowFocus);

    // Cleanup on destroy
    return () => {
      // Centralized timeout cleanup (idempotent)
      this.clearAllTimeouts();
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusin', handleCanvasFocus);
      document.removeEventListener('focusout', handleBlur);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }

  /**
   * Clear and nullify all internal timeouts in an idempotent way.
   * Calling this multiple times is safe.
   */
  private clearAllTimeouts() {
    if (this.blurTimeoutId !== null) {
      clearTimeout(this.blurTimeoutId);
      this.blurTimeoutId = null;
    }
    if (this.focusDebounceTimeout !== null) {
      clearTimeout(this.focusDebounceTimeout);
      this.focusDebounceTimeout = null;
    }
  }

  /**
   * Handle key press from HID
   */
  async handleKeyPress(key: string, velocity: number = 100) {
    // Guard: prevent execution if instance is being destroyed
    if (!this.chuck || !this.getEnabled()) return;

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
    // Guard: prevent execution if instance is being destroyed
    if (!this.chuck || !this.getEnabled()) return;

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
        // Calculate frequency from MIDI note if not provided
        const freq = hz || (440 * Math.pow(2, (midiNote - 69) / 12));
        
        // Set all variables BEFORE broadcasting event to ensure ChucK reads correct values
        await this.chuck.setInt('hidMidiNote', midiNote);
        await this.chuck.setInt('hidVelocity', velocity);
        await this.chuck.setFloat('hidFreq', freq);
        
        // Small delay to ensure variables are set before event is broadcast
        await new Promise(resolve => setTimeout(resolve, 1));
        
        await this.chuck.broadcastEvent('hidNoteOn');
        console.log(`[HID] Note ON: MIDI ${midiNote}, vel ${velocity}, freq ${freq.toFixed(2)}Hz`);
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
   * WebChucK HID also captures keyboard events, but we listen directly for MIDI note mapping
   * IMPORTANT: 
   * - Only processes events when Babylon canvas is focused
   * - Does NOT call stopPropagation() to allow WebChucK's HID listeners to also receive events
   * - WebChucK's keyboard listeners are enabled/disabled via setEnabled() based on canvas focus
   */
  async startListening() {
    // Set up direct JavaScript keyboard event listeners
    // The HID class in WebChucK handles the ChucK side, but we also want
    // to handle it on the JavaScript side for immediate feedback
    const handleKeyDown = (e: KeyboardEvent) => {
      // CRITICAL: Only process if Babylon canvas is focused
      if (!this.getEnabled() || !this.isCanvasFocused()) {

        return;
      }
      
      // Prevent default only for our mapped keys when canvas is focused
      // IMPORTANT: Do NOT call stopPropagation() - WebChucK's HID listeners need to receive events
      // WebChucK's HID attaches listeners to document, so events must bubble through
      if (KEYBOARD_MAP[e.key.toLowerCase()]) {

        e.preventDefault(); // Prevent typing, but allow event to propagate to WebChucK's HID
        this.handleKeyPress(e.key, 100);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // CRITICAL: Only process if Babylon canvas is focused
      if (!this.getEnabled() || !this.isCanvasFocused()) {
        return;
      }
      
      if (KEYBOARD_MAP[e.key.toLowerCase()]) {
        e.preventDefault(); // Prevent typing, but allow event to propagate to WebChucK's HID
        this.handleKeyRelease(e.key);
      }
    };

    // Use capture phase to catch events early, but still check focus
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    // Store cleanup function
    (this as any)._cleanupKeyboardListeners = () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };

    console.log('✅ JavaScript keyboard listeners active (Babylon canvas focus required)');
  }

  /**
   * Cleanup - CRITICAL: Must be called to prevent memory leaks
   */
  destroy() {
    // Clear any pending timeouts (centralized and idempotent)
    this.clearAllTimeouts();
    
    // Cleanup focus/click handlers (CRITICAL - prevents memory leak)
    if (this.cleanupFocusHandlers) {
      this.cleanupFocusHandlers();
      this.cleanupFocusHandlers = null;
    }
    
    // Cleanup keyboard listeners
    if ((this as any)._cleanupKeyboardListeners) {
      (this as any)._cleanupKeyboardListeners();
      (this as any)._cleanupKeyboardListeners = null;
    }
    
    // Release all pressed keys
    pressedKeys.forEach(midiNote => {
      this.triggerNoteOff(midiNote);
    });
    pressedKeys.clear();
    this.triggers = [];
    
    // Clear global callback to prevent holding references to components
    if (pressedKeysCallback) {
      pressedKeysCallback = null;
    }
    
    // Clear global window reference to prevent pointer errors and allow GC
    if (typeof window !== 'undefined' && (window as any).__keyboardHIDManager === this) {
      (window as any).__keyboardHIDManager = null;
    }
    
    // Clear references
    this.hid = null;
    this.chuck = null;
  }
}

