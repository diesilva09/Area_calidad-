import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex items-center justify-center text-red-500">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Error al cargar los datos
          </h3>
          <p className="text-gray-600 text-sm">
            {error}
          </p>
        </div>
        <Button
          onClick={onRetry}
          className="flex items-center space-x-2 mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reintentar</span>
        </Button>
      </div>
    </div>
  );
}
