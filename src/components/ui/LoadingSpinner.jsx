/**
 * @fileoverview Reusable loading spinner component
 */

import { Spinner, Typography } from '@material-tailwind/react';

/**
 * LoadingSpinner component for showing loading states
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.size='md'] - Size of the spinner ('sm', 'md', 'lg')
 * @param {string} [props.color='blue'] - Color of the spinner
 * @param {string} [props.message] - Optional loading message
 * @param {boolean} [props.fullScreen=false] - Whether to show full screen loading
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 * 
 * @example
 * <LoadingSpinner 
 *   size="lg" 
 *   message="Processing PDF..." 
 *   fullScreen 
 * />
 */
export function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  message, 
  fullScreen = false,
  className = ''
}) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-gray-50 flex items-center justify-center'
    : 'flex items-center justify-center p-4';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Spinner 
          className={sizeClasses[size]} 
          color={color} 
        />
        {message && (
          <Typography 
            color="gray" 
            className={`text-center ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
          >
            {message}
          </Typography>
        )}
      </div>
    </div>
  );
}