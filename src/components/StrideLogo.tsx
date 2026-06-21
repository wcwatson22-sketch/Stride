import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface StrideLogoProps {
  size?: number;
  color?: string;
}

/**
 * Stride lightning-bolt mark. Replace this SVG path with final artwork
 * before App Store submission — the interface (size, color props) stays stable.
 */
export function StrideLogo({ size = 56, color = '#4A6CF7' }: StrideLogoProps) {
  // Classic downward-pointing lightning bolt, viewBox 0 0 24 24
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <Path
        d="M13 2L4.5 13.5H10L11 22L19.5 10.5H14Z"
        fill={color}
      />
    </Svg>
  );
}
