import React from "react";
import { WatermarkSettings } from "@/types/watermark";

interface WatermarkControlProps {
  settings: WatermarkSettings;
  onChange: (settings: WatermarkSettings) => void;
}

const PRESET_COLORS = [
  "#FF0000", // Red
  "#0000FF", // Blue
  "#008000", // Green
  "#808080", // Gray
  "#000000", // Black
  "#FFA500", // Orange
  "#800080", // Purple
];

export default function WatermarkControl({
  settings,
  onChange,
}: WatermarkControlProps) {
  const updateSetting = <K extends keyof WatermarkSettings>(
    key: K,
    value: WatermarkSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
          Watermark Customization
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Configure the visual watermark overlay settings.
        </p>
      </div>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      {/* Watermark Text */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Watermark Text
        </label>
        <div className="relative">
          <input
            type="text"
            value={settings.text}
            onChange={(e) => updateSetting("text", e.target.value)}
            placeholder="e.g. CONFIDENTIAL"
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {settings.text && (
            <button
              onClick={() => updateSetting("text", "")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Font Style Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => updateSetting("bold", !settings.bold)}
          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
            settings.bold
              ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900"
              : "bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          Bold
        </button>
        <button
          onClick={() => updateSetting("italic", !settings.italic)}
          className={`flex-1 py-2 rounded-lg text-sm italic border transition-all ${
            settings.italic
              ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900"
              : "bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          Italic
        </button>
      </div>

      {/* Layout Option */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Layout Pattern
        </label>
        <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
          <button
            onClick={() => updateSetting("layout", "single")}
            className={`py-1.5 rounded-md text-xs font-medium transition-all ${
              settings.layout === "single"
                ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-950 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-300"
            }`}
          >
            Centered Single
          </button>
          <button
            onClick={() => updateSetting("layout", "grid")}
            className={`py-1.5 rounded-md text-xs font-medium transition-all ${
              settings.layout === "grid"
                ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-950 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-300"
            }`}
          >
            Tiled Grid
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Font Size
          </label>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {settings.fontSize}px
          </span>
        </div>
        <input
          type="range"
          min="12"
          max="120"
          value={settings.fontSize}
          onChange={(e) => updateSetting("fontSize", parseInt(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer"
        />
        <div className="flex justify-between gap-1 mt-1">
          {[16, 24, 36, 48, 72].map((size) => (
            <button
              key={size}
              onClick={() => updateSetting("fontSize", size)}
              className="px-2 py-1 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Color
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={settings.color}
            onChange={(e) => updateSetting("color", e.target.value)}
            className="w-8 h-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-0 overflow-hidden cursor-pointer"
          />
          <input
            type="text"
            value={settings.color}
            onChange={(e) => updateSetting("color", e.target.value)}
            className="w-24 px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 mt-1 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateSetting("color", c)}
              className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-800 transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Opacity
          </label>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {Math.round(settings.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={settings.opacity * 100}
          onChange={(e) => updateSetting("opacity", parseInt(e.target.value) / 100)}
          className="w-full accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Rotation */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Rotation Angle
          </label>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {settings.rotation}°
          </span>
        </div>
        <input
          type="range"
          min="-180"
          max="180"
          step="5"
          value={settings.rotation}
          onChange={(e) => updateSetting("rotation", parseInt(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer"
        />
        <div className="flex gap-1.5 mt-1">
          {[-45, 0, 45, 90].map((angle) => (
            <button
              key={angle}
              onClick={() => updateSetting("rotation", angle)}
              className="flex-1 py-1 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {angle}°
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
