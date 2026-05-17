'use client';
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center px-4">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-4">Please refresh the page or try again.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
