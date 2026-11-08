/** Page publique ; le composant délègue la logique au hook. */
import AuthForm from '../../components/AuthForm.jsx';
export default function Page() {
  return <AuthForm mode="login" />;
}
