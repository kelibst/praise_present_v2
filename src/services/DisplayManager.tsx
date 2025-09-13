import { screen, Display, nativeImage, desktopCapturer } from "electron";
import { execSync } from "child_process";
import { platform } from "os";

export interface DisplayInfo {
  id: number;
  label: string;
  manufacturer?: string;
  model?: string;
  friendlyName: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  rotation: number;
  touchSupport: "available" | "unavailable" | "unknown";
  isPrimary: boolean;
  colorSpace?: string;
  colorDepth?: number;
  accelerometerSupport?: "available" | "unavailable" | "unknown";
  nativeInfo?: any; // For debugging native display data
}

interface NativeDisplayInfo {
  manufacturer?: string;
  model?: string;
  name?: string;
  instanceName?: string;
  deviceString?: string;
}

export class DisplayManager {
  private static instance: DisplayManager;
  private displays: DisplayInfo[] = [];
  private primaryDisplay: DisplayInfo | null = null;
  private secondaryDisplay: DisplayInfo | null = null;
  private changeListener: (() => void) | null = null;
  private isInitialized: boolean = false;
  private nativeDisplays: Map<string, NativeDisplayInfo> = new Map(); // Cache native display info

  private constructor() {
    // Don't initialize here - wait until app is ready
  }

  public static getInstance(): DisplayManager {
    if (!DisplayManager.instance) {
      DisplayManager.instance = new DisplayManager();
    }
    return DisplayManager.instance;
  }

  /**
   * Initialize the display manager after app is ready
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    console.log("Initializing DisplayManager...");
    this.loadNativeDisplayInfo(); // Load native display info first
    this.refreshDisplays();
    this.setupEventListeners();
    this.isInitialized = true;
    console.log("DisplayManager initialized successfully");
  }

  /**
   * Load native display information using platform-specific methods
   */
  private loadNativeDisplayInfo(): void {
    try {
      console.log("Loading native display information...");
      console.log("Platform detected:", platform());
      console.log("Process platform:", process.platform);

      // Check for WSL environment
      const isWSL = this.isWSLEnvironment();
      console.log("WSL environment detected:", isWSL);

      if (platform() === "win32" || isWSL) {
        this.loadWindowsDisplayInfo();
      } else if (platform() === "darwin") {
        this.loadMacDisplayInfo();
      } else {
        this.loadLinuxDisplayInfo();
      }

      console.log(
        "Native display info loaded:",
        Array.from(this.nativeDisplays.entries())
      );
    } catch (error) {
      console.warn("Failed to load native display info:", error);
    }
  }

  /**
   * Detect if running in WSL environment
   */
  private isWSLEnvironment(): boolean {
    try {
      // Check for WSL indicators
      const fs = require("fs");
      if (fs.existsSync("/proc/version")) {
        const version = fs.readFileSync("/proc/version", "utf8");
        return (
          version.toLowerCase().includes("microsoft") ||
          version.toLowerCase().includes("wsl")
        );
      }

      // Alternative checks
      return !!(
        process.env.WSL_DISTRO_NAME ||
        process.env.WSLENV ||
        (process.platform === "linux" && process.env.PATH?.includes("/mnt/c"))
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Load Windows display information using WMI
   */
  private loadWindowsDisplayInfo(): void {
    try {
      console.log("Attempting to get Windows display info via PowerShell...");

      // Simplified PowerShell command that should work in WSL too
      const powershellCommand = `Get-WmiObject -Class Win32_DesktopMonitor | Select-Object Name, MonitorManufacturer, MonitorType | ConvertTo-Json`;

      let command = "";
      if (this.isWSLEnvironment()) {
        // WSL2 - call PowerShell through Windows
        command = `powershell.exe -Command "${powershellCommand}"`;
      } else {
        // Native Windows
        command = `powershell -Command "${powershellCommand}"`;
      }

      console.log("Executing command:", command);

      const result = execSync(command, {
        encoding: "utf8",
        timeout: 15000,
      });

      console.log("PowerShell result:", result);

      if (result.trim()) {
        const monitors = JSON.parse(result);
        const monitorArray = Array.isArray(monitors) ? monitors : [monitors];

        monitorArray.forEach((monitor, index) => {
          console.log(`Processing monitor ${index}:`, monitor);
          if (monitor) {
            const key = `monitor_${index}`;
            this.nativeDisplays.set(key, {
              manufacturer: monitor.MonitorManufacturer || "Unknown",
              model: monitor.MonitorType || monitor.Name || "Unknown",
              name: monitor.Name || `Monitor ${index + 1}`,
            });
          }
        });
      }

      // Also try to get PnP device info for more details
      this.loadWindowsPnPDevices();
    } catch (error) {
      console.warn("Failed to get Windows display info via PowerShell:", error);
      this.loadWindowsDisplayInfoFallback();
    }
  }

  /**
   * Get PnP device information for displays
   */
  private loadWindowsPnPDevices(): void {
    try {
      console.log("Getting PnP device information...");

      const pnpCommand = `Get-PnpDevice -Class Monitor | Select-Object FriendlyName, Manufacturer, Status | ConvertTo-Json`;

      let command = "";
      if (this.isWSLEnvironment()) {
        command = `powershell.exe -Command "${pnpCommand}"`;
      } else {
        command = `powershell -Command "${pnpCommand}"`;
      }

      const result = execSync(command, {
        encoding: "utf8",
        timeout: 10000,
      });

      console.log("PnP result:", result);

      if (result.trim()) {
        const devices = JSON.parse(result);
        const deviceArray = Array.isArray(devices) ? devices : [devices];

        deviceArray.forEach((device, index) => {
          if (device && device.Status === "OK") {
            const key = `pnp_monitor_${index}`;
            this.nativeDisplays.set(key, {
              manufacturer: device.Manufacturer || "Unknown",
              model: device.FriendlyName || "Unknown",
              name: device.FriendlyName,
            });
          }
        });
      }
    } catch (error) {
      console.warn("Failed to get PnP device info:", error);
    }
  }

  /**
   * Fallback Windows display detection using WMIC
   */
  private loadWindowsDisplayInfoFallback(): void {
    try {
      console.log("Attempting WMIC fallback...");

      let command = "";
      if (this.isWSLEnvironment()) {
        command =
          "wmic.exe desktopmonitor get name,monitormanufacturer,monitortype /format:csv";
      } else {
        command =
          "wmic desktopmonitor get name,monitormanufacturer,monitortype /format:csv";
      }

      const wmicResult = execSync(command, {
        encoding: "utf8",
        timeout: 5000,
      });

      console.log("WMIC result:", wmicResult);

      const lines = wmicResult
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("Node"));
      lines.forEach((line, index) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 3) {
          const key = `wmic_monitor_${index}`;
          this.nativeDisplays.set(key, {
            manufacturer: parts[1] || "Unknown",
            model: parts[2] || parts[3] || "Unknown",
            name: parts[3] || `Monitor ${index + 1}`,
          });
        }
      });
    } catch (error) {
      console.warn("WMIC fallback also failed:", error);
    }
  }

  /**
   * Load macOS display information
   */
  private loadMacDisplayInfo(): void {
    try {
      const result = execSync("system_profiler SPDisplaysDataType -json", {
        encoding: "utf8",
        timeout: 10000,
      });

      const data = JSON.parse(result);
      const displays = data.SPDisplaysDataType || [];

      displays.forEach((display: any, index: number) => {
        const key = `mac_display_${index}`;
        this.nativeDisplays.set(key, {
          manufacturer: display._name?.split(" ")[0] || "Unknown",
          model: display._name || "Unknown",
          name: display._name,
          deviceString:
            display.spdisplays_display_vendor || display.spdisplays_vendor,
        });
      });
    } catch (error) {
      console.warn("Failed to get macOS display info:", error);
    }
  }

  /**
   * Load Linux display information
   */
  private loadLinuxDisplayInfo(): void {
    try {
      // Try xrandr first
      const xrandrResult = execSync("xrandr --verbose", {
        encoding: "utf8",
        timeout: 5000,
      });

      const lines = xrandrResult.split("\n");
      let currentDisplay: any = {};
      let displayIndex = 0;

      lines.forEach((line) => {
        if (line.match(/^\w+.*connected/)) {
          if (currentDisplay.name) {
            const key = `linux_display_${displayIndex++}`;
            this.nativeDisplays.set(key, currentDisplay);
          }
          currentDisplay = { name: line.split(" ")[0] };
        } else if (line.includes("Brightness:")) {
          currentDisplay.brightness = line.split(":")[1].trim();
        } else if (line.includes("EDID:")) {
          // EDID info follows, but it's complex to parse
        }
      });

      if (currentDisplay.name) {
        const key = `linux_display_${displayIndex}`;
        this.nativeDisplays.set(key, currentDisplay);
      }
    } catch (error) {
      console.warn("Failed to get Linux display info via xrandr:", error);

      // Try alternative methods
      try {
        const lsResult = execSync(
          "ls /sys/class/drm/card*/edid 2>/dev/null || true",
          {
            encoding: "utf8",
            timeout: 3000,
          }
        );
        console.log("Available EDID files:", lsResult);
      } catch (err) {
        console.warn("No EDID files found");
      }
    }
  }

  /**
   * Match native display info with Electron display
   */
  private matchNativeDisplay(
    electronDisplay: Display,
    index: number
  ): NativeDisplayInfo | null {
    // Try to match by resolution, position, or index
    const resolution = `${electronDisplay.bounds.width}x${electronDisplay.bounds.height}`;

    // First, try to find by index from different sources (order of preference)
    const byIndex =
      this.nativeDisplays.get(`pnp_monitor_${index}`) || // PnP devices (most reliable)
      this.nativeDisplays.get(`monitor_${index}`) || // WMI Win32_DesktopMonitor
      this.nativeDisplays.get(`mac_display_${index}`) ||
      this.nativeDisplays.get(`linux_display_${index}`) ||
      this.nativeDisplays.get(`wmic_monitor_${index}`);

    if (byIndex && byIndex.manufacturer !== "Unknown") {
      console.log(
        `Matched display ${electronDisplay.id} (index ${index}) with native info:`,
        byIndex
      );
      return byIndex;
    }

    // If we have only as many native displays as Electron displays, match by order
    const nativeDisplaysArray = Array.from(this.nativeDisplays.values());
    // console.log(
    //   `Available native displays: ${nativeDisplaysArray.length}, electron displays: need index ${index}`
    // );

    if (nativeDisplaysArray.length > 0 && index < nativeDisplaysArray.length) {
      // Filter out 'Unknown' entries and prefer those with real manufacturer info
      const validDisplays = nativeDisplaysArray.filter(
        (d) => d.manufacturer && d.manufacturer !== "Unknown"
      );
      if (validDisplays.length > index) {
        console.log(
          `Matched display ${electronDisplay.id} with valid native info at index ${index}:`,
          validDisplays[index]
        );
        return validDisplays[index];
      }

      // Fallback to any available info
      console.log(
        `Fallback match for display ${electronDisplay.id} at index ${index}:`,
        nativeDisplaysArray[index]
      );
      return nativeDisplaysArray[index];
    }

    console.log(
      `No native display info found for display ${electronDisplay.id} (index ${index})`
    );
    return null;
  }

  /**
   * Get all available displays
   */
  public getDisplays(): DisplayInfo[] {
    this.refreshDisplays();
    return [...this.displays];
  }

  /**
   * Get the primary display
   */
  public getPrimaryDisplay(): DisplayInfo | null {
    this.refreshDisplays();
    return this.primaryDisplay;
  }

  /**
   * Get the secondary display (first non-primary display found)
   */
  public getSecondaryDisplay(): DisplayInfo | null {
    this.refreshDisplays();
    return this.secondaryDisplay;
  }

  /**
   * Get display by ID
   */
  public getDisplayById(id: number): DisplayInfo | null {
    return this.displays.find((display) => display.id === id) || null;
  }

  /**
   * Check if multiple displays are available
   */
  public hasMultipleDisplays(): boolean {
    return this.displays.length > 1;
  }

  /**
   * Get display count
   */
  public getDisplayCount(): number {
    return this.displays.length;
  }

  /**
   * Capture screenshot of a specific display
   */
  public async captureDisplay(displayId: number): Promise<string | null> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 320, height: 180 },
      });

      // Find the source that matches our display
      const display = this.getDisplayById(displayId);
      if (!display) {
        throw new Error(`Display ${displayId} not found`);
      }

      // For now, return the first screen source as a fallback
      // In a more sophisticated implementation, you'd match by display bounds
      const source =
        sources.find((source) => source.display_id === displayId.toString()) ||
        sources[0];

      if (source && source.thumbnail) {
        return source.thumbnail.toDataURL();
      }

      return null;
    } catch (error) {
      console.error("Failed to capture display:", error);
      return null;
    }
  }

  /**
   * Set up event listeners for display changes
   */
  private setupEventListeners(): void {
    if (!this.isInitialized) {
      console.warn(
        "DisplayManager not initialized, skipping event listeners setup"
      );
      return;
    }

    screen.on("display-added", () => {
      console.log("Display added");
      this.refreshDisplays();
      this.notifyDisplayChange();
    });

    screen.on("display-removed", () => {
      console.log("Display removed");
      this.refreshDisplays();
      this.notifyDisplayChange();
    });

    screen.on("display-metrics-changed", () => {
      console.log("Display metrics changed");
      this.refreshDisplays();
      this.notifyDisplayChange();
    });
  }

  /**
   * Extract manufacturer and model from display label with native info enhancement
   */
  private parseDisplayInfo(
    label: string,
    nativeInfo?: NativeDisplayInfo
  ): { manufacturer?: string; model?: string; friendlyName: string } {
    // If we have native info, use it first
    if (nativeInfo?.manufacturer && nativeInfo?.manufacturer !== "Unknown") {
      const manufacturer = nativeInfo.manufacturer;
      const model =
        nativeInfo.model && nativeInfo.model !== "Unknown"
          ? nativeInfo.model
          : nativeInfo.name || "";

      if (model) {
        return {
          manufacturer,
          model,
          friendlyName: `${manufacturer} ${model}`.trim(),
        };
      } else {
        return {
          manufacturer,
          friendlyName: `${manufacturer} Monitor`,
        };
      }
    }

    // Fallback to parsing label
    const patterns = [
      // "Samsung S24E650" or "Samsung 24E650"
      /^(Samsung|LG|Dell|HP|Acer|ASUS|AOC|BenQ|ViewSonic|Philips|Sony|Lenovo|MSI)\s*(.+)$/i,
      // "SAMSUNG S24E650"
      /^([A-Z]+)\s+(.+)$/,
      // Generic patterns
      /^(.+?)\s+(\d+[\w\d]*.*?)$/,
    ];

    for (const pattern of patterns) {
      const match = label.match(pattern);
      if (match) {
        const [, manufacturer, model] = match;
        return {
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          friendlyName: `${manufacturer.trim()} ${model.trim()}`,
        };
      }
    }

    // Enhanced generic display names
    if (label.toLowerCase().includes("display")) {
      const displayNumber = label.match(/\d+/)?.[0];
      return {
        friendlyName: displayNumber
          ? `Monitor ${displayNumber}`
          : "External Monitor",
      };
    }

    return { friendlyName: label || "Unknown Display" };
  }

  /**
   * Generate a friendly display name with position info
   */
  private generateDisplayName(display: DisplayInfo, index: number): string {
    const { manufacturer, model, friendlyName } = this.parseDisplayInfo(
      display.label,
      display.nativeInfo
    );

    if (manufacturer && model) {
      return display.isPrimary
        ? `${friendlyName} (Primary)`
        : `${friendlyName} (Secondary)`;
    }

    // Fallback naming based on position and characteristics
    const resolution = `${display.bounds.width}×${display.bounds.height}`;
    const position = display.isPrimary ? "Primary" : "Secondary";

    // Use native info if available for better names
    if (
      display.nativeInfo?.manufacturer &&
      display.nativeInfo.manufacturer !== "Unknown"
    ) {
      const manufacturerName = display.nativeInfo.manufacturer;
      return `${manufacturerName} ${position} Monitor (${resolution})`;
    }

    if (display.bounds.width >= 2560) {
      return `${position} Monitor (4K ${resolution})`;
    } else if (display.bounds.width >= 1920) {
      return `${position} Monitor (Full HD ${resolution})`;
    } else {
      return `${position} Monitor (${resolution})`;
    }
  }

  /**
   * Refresh the displays list
   */
  private refreshDisplays(): void {
    if (!this.isInitialized) {
      console.warn("DisplayManager not initialized, cannot refresh displays");
      return;
    }

    try {
      const electronDisplays = screen.getAllDisplays();
      const primaryElectronDisplay = screen.getPrimaryDisplay();

      this.displays = electronDisplays.map((display, index) => {
        const nativeInfo = this.matchNativeDisplay(display, index);
        const displayInfo = this.convertElectronDisplay(display, nativeInfo);
        // Add enhanced naming
        displayInfo.friendlyName = this.generateDisplayName(displayInfo, index);
        return displayInfo;
      });

      const primaryNativeInfo = this.matchNativeDisplay(
        primaryElectronDisplay,
        0
      );
      this.primaryDisplay = this.convertElectronDisplay(
        primaryElectronDisplay,
        primaryNativeInfo
      );
      if (this.primaryDisplay) {
        this.primaryDisplay.friendlyName = this.generateDisplayName(
          this.primaryDisplay,
          0
        );
      }

      this.secondaryDisplay =
        this.displays.find((display) => !display.isPrimary) || null;

      console.log(
        `Found ${this.displays.length} display(s):`,
        this.displays.map((d) => ({
          id: d.id,
          label: d.label,
          friendlyName: d.friendlyName,
          manufacturer: d.manufacturer,
          model: d.model,
          bounds: d.bounds,
          isPrimary: d.isPrimary,
          nativeInfo: d.nativeInfo,
        }))
      );
    } catch (error) {
      console.error("Error refreshing displays:", error);
      this.displays = [];
      this.primaryDisplay = null;
      this.secondaryDisplay = null;
    }
  }

  /**
   * Convert Electron Display to DisplayInfo with native info integration
   */
  private convertElectronDisplay(
    display: Display,
    nativeInfo?: NativeDisplayInfo | null
  ): DisplayInfo {
    const { manufacturer, model, friendlyName } = this.parseDisplayInfo(
      display.label,
      nativeInfo || undefined
    );

    return {
      id: display.id,
      label: display.label || `Display ${display.id}`,
      manufacturer: manufacturer || nativeInfo?.manufacturer,
      model: model || nativeInfo?.model,
      friendlyName,
      bounds: {
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
      },
      workArea: {
        x: display.workArea.x,
        y: display.workArea.y,
        width: display.workArea.width,
        height: display.workArea.height,
      },
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      touchSupport: display.touchSupport,
      isPrimary: display.id === screen.getPrimaryDisplay().id,
      colorSpace: (display as any).colorSpace,
      colorDepth: (display as any).colorDepth,
      accelerometerSupport: (display as any).accelerometerSupport,
      nativeInfo: nativeInfo || undefined, // Include native info for debugging
    };
  }

  /**
   * Set change listener callback
   */
  public setChangeListener(callback: () => void): void {
    this.changeListener = callback;
  }

  /**
   * Remove change listener
   */
  public removeChangeListener(): void {
    this.changeListener = null;
  }

  /**
   * Notify about display changes
   */
  private notifyDisplayChange(): void {
    if (this.changeListener) {
      this.changeListener();
    }
  }

  /**
   * Get display configuration for debugging
   */
  public getDisplayConfiguration(): object {
    return {
      displayCount: this.displays.length,
      hasMultipleDisplays: this.hasMultipleDisplays(),
      primaryDisplay: this.primaryDisplay,
      secondaryDisplay: this.secondaryDisplay,
      allDisplays: this.displays,
      isInitialized: this.isInitialized,
    };
  }
}

// Export a singleton instance but don't initialize it yet
export const displayManager = DisplayManager.getInstance();
