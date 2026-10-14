import type { ReactNode } from 'react';
import { STATUS_LABEL, type Status } from '../lib/data';

/** 状态印记：实心红方 = 已核实；斜线 = 待核实；空框 = 未演出 */
export function StatusMark({ status, label = false }: { status: Status; label?: boolean }) {
  return (
    <span className={`status status--${status.toLowerCase()}`} title={`${status} · ${STATUS_LABEL[status]}`}>
      <i aria-hidden />
      {label && (
        <b>
          {status}
          <em>{STATUS_LABEL[status]}</em>
        </b>
      )}
    </span>
  );
}

/** 文字纵向替换：值改变时，新文字自下而上裁切进入 */
export function Swap({ value, children, className = '' }: { value: string; children?: ReactNode; className?: string }) {
  return (
    <span className={`swap ${className}`}>
      <span key={value} className="swap__in">
        {children ?? value}
      </span>
    </span>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <div className="kicker">{children}</div>;
}

export function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 24 12" aria-hidden>
      <path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
