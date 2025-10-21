import { ClientChart, ChartPoint } from '@/app/components/client-chart';

type VisualizationTabProps = {
  data: ChartPoint[];
};

export function VisualizationTab({ data }: VisualizationTabProps) {
  return (
    <div className="pb-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <header>
          <h1 className="text-2xl font-semibold text-black">Dashboard</h1>
          <p className="mt-1 text-sm text-black/60">
            Review trends for your mood and sleep quality over time.
          </p>
        </header>

        <ClientChart data={data} />
      </div>
    </div>
  );
}
