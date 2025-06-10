/**
 * @fileoverview Error boundary component for catching React errors
 */

import React from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
} from '@material-tailwind/react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Error fallback component displayed when an error occurs
 * 
 * @component
 * @param {Object} props
 * @param {Error} props.error - The error that occurred
 * @param {function} props.resetError - Function to reset the error state
 * @returns {JSX.Element}
 */
function ErrorFallback({ error, resetError }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="text-center p-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          
          <Typography variant="h4" color="red" className="mb-2">
            Oops! Algo deu errado
          </Typography>
          
          <Typography color="gray" className="mb-6">
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para corrigir o problema.
          </Typography>
          
          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                Detalhes do erro (desenvolvimento)
              </summary>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button
              onClick={resetError}
              color="blue"
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Tentar novamente
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              variant="outlined"
              color="gray"
            >
              Recarregar página
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * Error boundary class component
 * Catches JavaScript errors anywhere in the child component tree
 * 
 * @class ErrorBoundary
 * @extends {React.Component}
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * Update state to show error UI
   * @param {Error} error - The error that occurred
   * @returns {Object} New state
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Log error information
   * @param {Error} error - The error that occurred
   * @param {Object} errorInfo - Component stack trace
   */
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, errorInfo);
    }
  }

  /**
   * Reset error state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component
 */
export const withErrorBoundary = (Component) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};