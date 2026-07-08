import React from 'react';
import zurichLogo from '../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

interface ScreenHeaderProps {
  title: string;
  subtitle?: React.ReactNode | string | (string | number | undefined | null | false)[];
}

export default function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  let objSubtitleNode: React.ReactNode = null;

  // Construimos el subtitulo segun venga como lista, texto o nodo.
  if (subtitle) {
    if (Array.isArray(subtitle)) {
      // Filtramos los valores vacios de la lista de subtitulos.
      const lstActiveSpans = subtitle.filter(Boolean);
      if (lstActiveSpans.length > 0) {
        objSubtitleNode = (
          <div className="subtitle">
            {lstActiveSpans.map((in_genText, in_intIdx) => (
              <span key={in_intIdx}>{in_genText}</span>
            ))}
          </div>
        );
      }
    } else if (typeof subtitle === 'string') {
      objSubtitleNode = (
        <div className="subtitle">
          <span>{subtitle}</span>
        </div>
      );
    } else {
      objSubtitleNode = subtitle;
    }
  }

  return (
    <div className="screen-header">
      <div className="title-block">
        <h1>{title}</h1>
        {objSubtitleNode}
      </div>
      <img src={zurichLogo} alt="Zurich" className="header-logo" />
    </div>
  );
}
