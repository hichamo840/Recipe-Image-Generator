
import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, description, ...props }) => {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-300">
        {label}
      </label>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>}
      <input
        {...props}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      />
    </div>
  );
};
