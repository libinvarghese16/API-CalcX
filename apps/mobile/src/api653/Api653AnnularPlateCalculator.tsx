import { Api653PlateRemainingLifeCalculator } from "./Api653BottomPlateCalculator.tsx";

export function Api653AnnularPlateCalculator({ onBack }: { onBack: () => void }) {
  return <Api653PlateRemainingLifeCalculator onBack={onBack} variant="annular" />;
}
