import type { Lab } from '../../types/lab';
import { ExecutableLab } from '../lab/ExecutableLab';
import { DeliverableLab } from '../lab/DeliverableLab';

interface LabExecutorProps {
  lab: Lab;
}

export const LabExecutor: React.FC<LabExecutorProps> = ({ lab }) => {
  if (lab.labType === 'DELIVERABLE') {
    return <DeliverableLab lab={lab} />;
  }
  return <ExecutableLab lab={lab} />;
};
