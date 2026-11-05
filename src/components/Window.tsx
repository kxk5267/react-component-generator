import type { ReactNode } from 'react';

interface WindowProps {
  title: string;
  label?: string;
  className?: string;
  onClose?: () => void;
  closeLabel?: string;
  children: ReactNode;
}

/** 클래식 데스크톱 윈도우. 닫기 박스가 있으면 클릭 가능한 버튼으로 렌더링한다. */
export function Window({ title, label, className = '', onClose, closeLabel, children }: WindowProps) {
  return (
    <section className={`window ${className}`} aria-label={label ?? title}>
      <div className="titlebar">
        {onClose ? (
          <button className="close-box" onClick={onClose} aria-label={closeLabel ?? '닫기'} title={closeLabel} />
        ) : (
          <span className="close-box close-box--idle" aria-hidden="true" />
        )}
        <span className="titlebar-text">{title}</span>
      </div>
      <div className="window-body">{children}</div>
    </section>
  );
}
