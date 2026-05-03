import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export function BetaToggle() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="beta-toggle" />
      <Label htmlFor="beta-toggle">Show beta versions</Label>
    </div>
  );
}
