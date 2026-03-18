import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = { hasError: false };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh', background: '#0B0B0B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px',
                }}>
                    <div style={{
                        maxWidth: '440px', width: '100%',
                        background: 'rgba(22,22,22,0.9)',
                        border: '1px solid rgba(212,175,55,0.25)',
                        borderRadius: '20px',
                        padding: '40px 36px',
                        textAlign: 'center',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.06)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Gold top accent line */}
                        <div style={{
                            position: 'absolute', top: 0, left: '50%',
                            transform: 'translateX(-50%)',
                            width: '160px', height: '1px',
                            background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                        }} />

                        {/* Animated icon */}
                        <div style={{
                            fontSize: '2.8rem', marginBottom: '20px',
                            display: 'inline-block',
                            animation: 'float 3s ease-in-out infinite',
                        }}>⚠️</div>

                        <h2 style={{
                            fontSize: '1.4rem', fontWeight: 700,
                            color: '#EAEAEA', marginBottom: '10px',
                            fontFamily: 'Poppins, Inter, sans-serif',
                        }}>
                            Something went wrong
                        </h2>
                        <p style={{
                            fontSize: '0.875rem', color: '#666',
                            lineHeight: 1.7, marginBottom: '28px',
                        }}>
                            An unexpected error occurred. Refresh the page to get back on track.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                width: '100%', padding: '13px',
                                background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                                border: 'none', borderRadius: '12px',
                                color: '#0B0B0B', fontWeight: 700,
                                fontSize: '0.95rem', cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(212,175,55,0.55)';
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(212,175,55,0.3)';
                                (e.currentTarget as HTMLElement).style.transform = 'none';
                            }}
                        >
                            ↺ &nbsp;Refresh Page
                        </button>

                        {import.meta.env.DEV && this.state.error && (
                            <details style={{ marginTop: '20px', textAlign: 'left' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#444' }}>
                                    Error details
                                </summary>
                                <pre style={{
                                    marginTop: '8px', fontSize: '0.7rem',
                                    color: '#ef4444', background: '#111',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: '8px', padding: '10px',
                                    overflow: 'auto', maxHeight: '160px',
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                }}>
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
