import { Api653PlateRemainingLifeCalculator } from "./Api653BottomPlateCalculator.tsx";
import type { Api653CalculatorWorkflowProps } from "./Api653RecordWorkflow.tsx";

export function Api653AnnularPlateCalculator(props: Api653CalculatorWorkflowProps & { onBack: () => void }) {
  return <Api653PlateRemainingLifeCalculator {...props} variant="annular" />;
}
