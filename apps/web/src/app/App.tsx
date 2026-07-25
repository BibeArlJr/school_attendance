import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { SchoolThemeProvider } from './providers/SchoolThemeProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { router } from './router/router';
import { Toaster } from '@/shared/components/ui/sonner';

export function App() {
  return (
    <ThemeProvider>
      <SchoolThemeProvider>
        <QueryProvider>
          <RouterProvider router={router} />
          <Toaster />
        </QueryProvider>
      </SchoolThemeProvider>
    </ThemeProvider>
  );
}
