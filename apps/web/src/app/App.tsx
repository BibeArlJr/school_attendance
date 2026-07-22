import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { router } from './router/router';
import { Toaster } from '@/shared/components/ui/sonner';

export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <RouterProvider router={router} />
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  );
}
