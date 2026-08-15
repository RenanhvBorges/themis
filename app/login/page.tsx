import { LoginForm } from "@/components/LoginForm";
import { Icon } from "@/components/icons";

export default function LoginPage() {
  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="mark">
            <Icon name="cadeado" />
          </div>
          <b>THEMIS</b>
          <span>
            Sistema de Apuração de Transgressões Disciplinares
            <br />
            BINFAE-RJ
          </span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
