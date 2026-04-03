import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            background: "#050a14",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontFamily: "system-ui, sans-serif",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 48 }}>🏎️</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#35C2FF" }}>
            Something went wrong
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 400,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {this.state.error || "An unexpected error occurred."}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              padding: "12px 28px",
              borderRadius: 8,
              border: "1px solid rgba(53,194,255,0.4)",
              background: "rgba(53,194,255,0.12)",
              color: "#35C2FF",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
