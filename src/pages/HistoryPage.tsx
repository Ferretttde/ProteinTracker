import { WeeklyChart } from '../components/History/WeeklyChart';
import { MonthlyChart } from '../components/History/MonthlyChart';

export function HistoryPage() {
  return (
    <div>
      <WeeklyChart />
      <MonthlyChart />
    </div>
  );
}
