import CarSimulator from "./components/game/CarSimulator";
import { ErrorBoundary } from "./components/game/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <CarSimulator />
    </ErrorBoundary>
  );
}
