type Props = {
  classCode: string;
  username: string;
  pin: string;
  teacherPassword: string;
  teacherUsername: string;
  onTeacherUsername: (value: string) => void;
  showPin: boolean;
  notice: string;
  onClassCode: (value: string) => void;
  onUsername: (value: string) => void;
  onPin: (value: string) => void;
  onTeacherPassword: (value: string) => void;
  onTogglePin: () => void;
  onStudentLogin: () => void;
  onTeacherLogin: () => void;
};

export function LoginScreen(props: Props) {
  return (
    <main className="login">
      <section className="login-card" aria-labelledby="login-heading">
        <Mascot pose="welcome" className="login-mascot" />
        <h1 id="login-heading">Place Value Factory</h1>
        <p className="login-intro">
          Ready to build? Use the access details from your teacher.
        </p>
        <form
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault();
            props.onStudentLogin();
          }}
        >
          <label>
            Class code
            <input
              autoComplete="off"
              aria-describedby={props.notice ? "login-error" : undefined}
              value={props.classCode}
              onChange={(event) => props.onClassCode(event.target.value)}
            />
          </label>
          <label>
            Username
            <input
              autoComplete="off"
              aria-describedby={props.notice ? "login-error" : undefined}
              value={props.username}
              onChange={(event) => props.onUsername(event.target.value)}
            />
          </label>
          <label>
            Six-digit PIN
            <input
              inputMode="numeric"
              aria-describedby={props.notice ? "login-error" : undefined}
              autoComplete="one-time-code"
              type={props.showPin ? "text" : "password"}
              pattern="[0-9]{6}"
              maxLength={6}
              value={props.pin}
              onChange={(event) => props.onPin(event.target.value)}
            />
          </label>
          <button
            className="secondary"
            type="button"
            onClick={props.onTogglePin}
          >
            {props.showPin ? "Hide PIN" : "Show PIN"}
          </button>
          <button type="submit">Student login</button>
        </form>
        <details>
          <summary>Teacher login</summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              props.onTeacherLogin();
            }}
          >
            <label>
              Teacher username
              <input
                autoComplete="username"
                aria-describedby={props.notice ? "login-error" : undefined}
                value={props.teacherUsername}
                onChange={(event) =>
                  props.onTeacherUsername(event.target.value)
                }
              />
            </label>
            <label>
              Teacher password
              <input
                type="password"
                aria-describedby={props.notice ? "login-error" : undefined}
                autoComplete="current-password"
                value={props.teacherPassword}
                onChange={(event) =>
                  props.onTeacherPassword(event.target.value)
                }
              />
            </label>
            <button type="submit">Teacher login</button>
          </form>
        </details>
        {props.notice && (
          <p id="login-error" role="alert">
            {props.notice}
          </p>
        )}
      </section>
    </main>
  );
}
import { Mascot } from "../components/FactoryArt.js";
