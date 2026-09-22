type Props = {
  classCode: string;
  username: string;
  pin: string;
  teacherPassword: string;
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
      <h1>Place Value Factory</h1>
      <p>Development mode uses fictional accounts only.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          props.onStudentLogin();
        }}
      >
        <label>
          Class code
          <input
            autoComplete="organization"
            value={props.classCode}
            onChange={(event) => props.onClassCode(event.target.value)}
          />
        </label>
        <label>
          Username
          <input
            autoComplete="username"
            value={props.username}
            onChange={(event) => props.onUsername(event.target.value)}
          />
        </label>
        <label>
          Six-digit PIN
          <input
            inputMode="numeric"
            autoComplete="current-password"
            type={props.showPin ? "text" : "password"}
            pattern="[0-9]{6}"
            maxLength={6}
            value={props.pin}
            onChange={(event) => props.onPin(event.target.value)}
          />
        </label>
        <button className="secondary" type="button" onClick={props.onTogglePin}>
          {props.showPin ? "Hide PIN" : "Show PIN"}
        </button>
        <button type="submit">Student login</button>
      </form>
      <details>
        <summary>Teacher development login</summary>
        <label>
          Teacher password
          <input
            type="password"
            autoComplete="current-password"
            value={props.teacherPassword}
            onChange={(event) => props.onTeacherPassword(event.target.value)}
          />
        </label>
        <button onClick={props.onTeacherLogin}>Teacher login</button>
      </details>
      {props.notice && <p role="alert">{props.notice}</p>}
    </main>
  );
}
