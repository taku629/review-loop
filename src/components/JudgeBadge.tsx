import { JUDGE_LABEL, type Judge } from '../lib/types';

export function JudgeBadge({ judge }: { judge: Judge }) {
  return <span className={`judge judge-${judge}`}>{JUDGE_LABEL[judge]}</span>;
}
