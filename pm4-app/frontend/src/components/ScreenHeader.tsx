import React from 'react';
import zurichLogo from '../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

interface ScreenHeaderProps {
  title: string;
  subtitle?: React.ReactNode | string | (string | number | undefined | null | false)[];
}

export default function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  let subtitleContent: React.ReactNode = null;

  if (subtitle) {
    if (Array.isArray(subtitle)) {
      const activeSpans = subtitle.filter(Boolean);
      if (activeSpans.length > 0) {
        subtitleContent = (
          <div className="subtitle">
            {activeSpans.map((text, idx) => (
              <span key={idx}>{text}</span>
            ))}
          </div>
        );
      }
    } else if (typeof subtitle === 'string') {
      subtitleContent = (
        <div className="subtitle">
          <span>{subtitle}</span>
        </div>
      );
    } else {
      subtitleContent = subtitle;
    }
  }

  return (
    <div className="screen-header">
      <div className="title-block">
        <h1>{title}</h1>
        {subtitleContent}
      </div>
      <img src={zurichLogo} alt="Zurich" className="header-logo" />
    </div>
  );
}
