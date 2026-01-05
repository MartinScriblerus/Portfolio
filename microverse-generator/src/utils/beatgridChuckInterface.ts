/**
 * WebChucK Interface for Beat Grid System
 * 
 * Provides TypeScript/JavaScript interface to the ChucK beat grid system.
 * Handles code generation, hot-swapping, and state management.
 */

export interface BeatGridEvent {
  time: number; // milliseconds from now
  action: number;
  data: number[];
  probability: number; // 0.0-1.0
}

export interface BeatGridClock {
  id: number;
  period: number; // milliseconds
  rate: number; // multiplier, 1.0 = normal
  active: boolean;
}

export interface BeatGridPattern {
  id: number;
  clockId: number;
  events: BeatGridEvent[];
  active: boolean;
}

export class BeatGridChuckInterface {
  private chuck: any; // WebChucK Chuck instance
  private coreShredId: number | null = null;
  private gridShredId: number | null = null;
  private isInitialized: boolean = false;

  constructor(chuck: any) {
    this.chuck = chuck;
  }

  /**
   * Initialize the beat grid system in ChucK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const coreCode = await this.getCoreCode();
    this.coreShredId = await this.chuck.runCode(coreCode);
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.isInitialized = true;
  }

  /**
   * Create a clock in ChucK
   */
  async createClock(id: number, periodMs: number): Promise<void> {
    const code = `
      grid.addClock(${id}, ${periodMs}::ms);
    `;
    await this.chuck.runCode(code);
  }

  /**
   * Create a pattern and return its index
   */
  async createPattern(id: number, clockId: number): Promise<number> {
    const code = `
      grid.addPattern(${id}, ${clockId});
    `;
    await this.chuck.runCode(code);
    // In real implementation, you'd get the return value
    return 0; // Placeholder
  }

  /**
   * Hot-swap pattern events (safe, non-blocking)
   */
  async swapPattern(patternId: number, events: BeatGridEvent[]): Promise<void> {
    // Build event array in ChucK
    const eventCode = this.buildEventArrayCode(events);
    
    const code = `
      Pattern @ pattern;
      grid.getPattern(${patternId}) @=> pattern;
      if (pattern != null) {
        ${eventCode}
        pattern.buildEvents(events);
      }
    `;
    
    // Run in control thread (non-blocking)
    await this.chuck.runCode(code);
  }

  /**
   * Build ChucK code to create an event array
   */
  private buildEventArrayCode(events: BeatGridEvent[]): string {
    let code = `Event events[${events.length}];\n`;
    
    events.forEach((event, i) => {
      const dataArray = `[${event.data.join(', ')}]`;
      const timeMs = event.time;
      code += `
        Event evt${i};
        float data${i}[${event.data.length}];
        ${event.data.map((d, j) => `${d} => data${i}[${j}];`).join('\n        ')}
        now + ${timeMs}::ms => time eventTime${i};
        evt${i}.init(eventTime${i}, ${event.action}, data${i}, ${event.probability});
        evt${i} @=> events[${i}];
      `;
    });
    
    return code;
  }

  /**
   * Set clock rate (hot-swappable)
   */
  async setClockRate(clockId: number, rate: number): Promise<void> {
    const code = `
      Clock @ clock;
      grid.getClock(${clockId}) @=> clock;
      if (clock != null) {
        clock.setRate(${rate});
      }
    `;
    await this.chuck.runCode(code);
  }

  /**
   * Start the beat grid audio loop
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const code = `
      spork ~ runGrid(grid);
    `;
    this.gridShredId = await this.chuck.runCode(code);
  }

  /**
   * Stop the beat grid
   */
  async stop(): Promise<void> {
    const code = `
      grid.stop();
    `;
    await this.chuck.runCode(code);
  }

  /**
   * Get the core ChucK code (loads from file or inline)
   */
  private async getCoreCode(): Promise<string> {
    // In production, you'd load this from a file or embed it
    // For now, return a reference to load the file
    return `
      Machine.add(me.dir() + "/beatgrid-core.ck") => int coreId;
      BeatGrid grid;
      grid.init();
    `;
  }

  /**
   * Create a custom event handler class in ChucK
   */
  async createCustomHandler(handlerCode: string): Promise<void> {
    const code = `
      ${handlerCode}
    `;
    await this.chuck.runCode(code);
  }
}

/**
 * Example usage:
 * 
 * const chuck = await Chuck.init([]);
 * const beatGrid = new BeatGridChuckInterface(chuck);
 * 
 * await beatGrid.initialize();
 * await beatGrid.createClock(0, 500); // 120 BPM
 * await beatGrid.createPattern(0, 0);
 * 
 * const events: BeatGridEvent[] = [
 *   { time: 0, action: 1, data: [0], probability: 1.0 },
 *   { time: 500, action: 1, data: [1], probability: 1.0 },
 *   { time: 1000, action: 1, data: [2], probability: 0.8 },
 * ];
 * 
 * await beatGrid.swapPattern(0, events);
 * await beatGrid.start();
 */





