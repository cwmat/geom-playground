import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Workspace } from "@/components/Workspace";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useGeomStore } from "@/stores/geom-store";

export default function App() {
  const { geosStatus, geosError, initGeos } = useGeomStore();

  useEffect(() => {
    initGeos();
  }, [initGeos]);

  return (
    <MainLayout>
      <ErrorBoundary fallbackLabel="Application error">
        {geosStatus === "loading" || geosStatus === "idle" ? (
          <div className="bg-app-gradient flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <LoadingSpinner size="lg" label="Initializing GEOS..." />
          </div>
        ) : geosStatus === "error" ? (
          <div className="bg-app-gradient flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <p className="text-sm text-error">
              Failed to initialize GEOS: {geosError}
            </p>
          </div>
        ) : (
          <Workspace />
        )}
      </ErrorBoundary>
    </MainLayout>
  );
}
