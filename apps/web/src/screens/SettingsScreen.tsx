import type { Settings } from "../models.js";
type Props = {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onSave: () => void;
  onBack: () => void;
};

export function SettingsScreen({ settings, onChange, onSave, onBack }: Props) {
  return (
    <main className="login">
      <h1>Factory settings</h1>
      <p>These supports never change game rewards.</p>
      <label>
        <input
          type="checkbox"
          checked={settings.sound}
          onChange={(event) =>
            onChange({ ...settings, sound: event.target.checked })
          }
        />{" "}
        Sound
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.reducedMotion}
          onChange={(event) =>
            onChange({ ...settings, reducedMotion: event.target.checked })
          }
        />{" "}
        Reduce motion
      </label>
      <label>
        Factory scenery
        <select
          value={settings.pressure}
          onChange={(event) =>
            onChange({
              ...settings,
              pressure: event.target.value as Settings["pressure"],
            })
          }
        >
          <option value="calm">Calm</option>
          <option value="busy">Busy (cosmetic)</option>
        </select>
      </label>
      <label>
        Text size
        <select
          value={settings.textScale}
          onChange={(event) =>
            onChange({
              ...settings,
              textScale: event.target.value as Settings["textScale"],
            })
          }
        >
          <option value="normal">Normal</option>
          <option value="large">Large</option>
        </select>
      </label>
      <button onClick={onSave}>Save settings</button>
      <button className="secondary" onClick={onBack}>
        Back to map
      </button>
    </main>
  );
}
